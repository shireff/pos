import { describe, it, expect } from 'vitest';
import { CustomerStatus } from './value-objects';
import { Customer } from './aggregates/customer.aggregate';
import { LoyaltyAccount } from './aggregates/loyalty-account.aggregate';
import { CreditLedger } from './aggregates/credit-ledger.aggregate';
import { CreditLimitGuardService } from './domain-services/credit-limit-guard.service';

describe('Customer aggregate', () => {
    it('creates customer with auto-generated loyalty code', () => {
        const customer = Customer.create({
            companyId: 'company-1',
            name: 'Ahmed Ali',
            phone: '01012345678',
        });
        expect(customer.id).toBeDefined();
        expect(customer.loyaltyCode).toMatch(/^LOY-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
        expect(customer.loyaltyTierId).toBe('bronze');
        expect(customer.status).toBe(CustomerStatus.Active);
    });

    it('updates profile and marks updatedAt', () => {
        const customer = Customer.create({
            companyId: 'company-1',
            name: 'Ahmed',
            phone: '01012345678',
        });
        customer.updateProfile({ name: 'Ahmed Updated' });
        expect(customer.name).toBe('Ahmed Updated');
        expect(customer.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('deactivates customer', () => {
        const customer = Customer.create({
            companyId: 'company-1',
            name: 'Ahmed',
            phone: '01012345678',
        });
        expect(customer.status).toBe(CustomerStatus.Active);
        customer.deactivate();
        expect(customer.status).toBe(CustomerStatus.Inactive);
    });
});

describe('LoyaltyAccount aggregate', () => {
    it('accrues points and upgrades tier', () => {
        const account = LoyaltyAccount.create('company-1', 'customer-1');
        expect(account.pointsBalance).toBe(0);
        expect(account.tierId).toBe('bronze');

        account.applyAccrual(1500);
        expect(account.pointsBalance).toBe(1500);
        expect(account.tierId).toBe('silver');
    });

    it('redeems points and downgrades tier', () => {
        const account = LoyaltyAccount.create('company-1', 'customer-1');
        account.applyAccrual(2000);
        account.applyRedemption(1500);
        expect(account.pointsBalance).toBe(500);
        expect(account.tierId).toBe('bronze');
    });

    it('blocks redemption that exceeds balance', () => {
        const account = LoyaltyAccount.create('company-1', 'customer-1');
        account.applyAccrual(500);
        expect(() => account.applyRedemption(600)).toThrow('Insufficient loyalty points');
    });

    it('reverses points on return', () => {
        const account = LoyaltyAccount.create('company-1', 'customer-1');
        account.applyAccrual(1000);
        account.applyRedemption(500);
        account.applyReversal(200);
        expect(account.pointsBalance).toBe(700);
    });
});

describe('CreditLedger aggregate', () => {
    it('applies purchase on credit and enforces limit', () => {
        const ledger = CreditLedger.create('company-1', 'customer-1', 10000);
        ledger.applyPurchaseOnCredit(5000);
        expect(ledger.balancePiasters).toBe(5000);

        expect(() => ledger.applyPurchaseOnCredit(6000)).toThrow('Credit limit exceeded');
    });

    it('applies payment and reduces balance', () => {
        const ledger = CreditLedger.create('company-1', 'customer-1', 10000);
        ledger.applyPurchaseOnCredit(8000);
        ledger.applyPayment(3000);
        expect(ledger.balancePiasters).toBe(5000);
    });

    it('applies credit note', () => {
        const ledger = CreditLedger.create('company-1', 'customer-1', 10000);
        ledger.applyPurchaseOnCredit(5000);
        ledger.applyCreditNote(2000);
        expect(ledger.balancePiasters).toBe(3000);
    });

    it('blocks reducing credit limit below balance', () => {
        const ledger = CreditLedger.create('company-1', 'customer-1', 10000);
        ledger.applyPurchaseOnCredit(5000);
        expect(() => ledger.updateCreditLimit(3000)).toThrow('Cannot reduce credit limit below current balance');
    });
});

describe('CreditLimitGuardService', () => {
    it('passes when within limit', () => {
        expect(() => CreditLimitGuardService.verify(3000, 2000, 10000)).not.toThrow();
    });

    it('blocks when exceeding limit', () => {
        expect(() => CreditLimitGuardService.verify(9000, 2000, 10000)).toThrow('Credit limit exceeded');
    });
});
