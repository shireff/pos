import { describe, it, expect } from 'vitest';
import { Supplier } from './aggregates/supplier.aggregate';
import { SupplierContact } from './value-objects/supplier-contact.vo';

describe('Supplier aggregate', () => {
  it('creates with required fields and defaults', () => {
    const supplier = Supplier.create({
      companyId: 'company-1',
      name: { ar: 'المورد', en: 'Supplier' },
      phone: '+201000000000',
    });

    expect(supplier.id).toBeDefined();
    expect(supplier.companyId).toBe('company-1');
    expect(supplier.name.ar).toBe('المورد');
    expect(supplier.name.en).toBe('Supplier');
    expect(supplier.phone).toBe('+201000000000');
    expect(supplier.isActive).toBe(true);
    expect(supplier.currency).toBe('EGP');
    expect(supplier.paymentTermsDays).toBe(0);
    expect(supplier.contacts).toEqual([]);
  });

  it('reconstitutes from persisted state', () => {
    const supplier = Supplier.reconstitute({
      id: 'supplier-1',
      companyId: 'company-1',
      name: { ar: 'المورد' },
      phone: '+201000000000',
      email: 'info@supplier.com',
      address: 'Cairo',
      taxId: 'TAX-123',
      paymentTermsDays: 30,
      currency: 'EGP',
      isActive: true,
      contacts: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    expect(supplier.id).toBe('supplier-1');
    expect(supplier.email).toBe('info@supplier.com');
    expect(supplier.taxId).toBe('TAX-123');
    expect(supplier.paymentTermsDays).toBe(30);
  });

  it('updates mutable fields', () => {
    const supplier = Supplier.create({
      companyId: 'company-1',
      name: { ar: 'المورد' },
      phone: '+201000000000',
    });

    supplier.update({
      phone: '+201111111111',
      email: 'new@supplier.com',
      paymentTermsDays: 60,
    });

    expect(supplier.phone).toBe('+201111111111');
    expect(supplier.email).toBe('new@supplier.com');
    expect(supplier.paymentTermsDays).toBe(60);
  });

  it('replaces contacts', () => {
    const supplier = Supplier.create({
      companyId: 'company-1',
      name: { ar: 'المورد' },
      phone: '+201000000000',
    });

    const contacts = [
      SupplierContact.create({ name: 'Ahmed', phone: '+201000000001', email: null, role: 'Manager' }),
    ];

    supplier.replaceContacts(contacts);
    expect(supplier.contacts).toHaveLength(1);
    expect(supplier.contacts[0].name).toBe('Ahmed');
  });

  it('deactivates and activates', () => {
    const supplier = Supplier.create({
      companyId: 'company-1',
      name: { ar: 'المورد' },
      phone: '+201000000000',
    });

    expect(supplier.isActive).toBe(true);
    supplier.deactivate();
    expect(supplier.isActive).toBe(false);
    supplier.activate();
    expect(supplier.isActive).toBe(true);
  });
});

describe('SupplierContact value object', () => {
  it('creates with valid data', () => {
    const contact = SupplierContact.create({ name: 'Ahmed', phone: '+201000000000', email: null, role: 'Manager' });
    expect(contact.name).toBe('Ahmed');
    expect(contact.phone).toBe('+201000000000');
    expect(contact.role).toBe('Manager');
  });

  it('throws when name is empty', () => {
    expect(() => SupplierContact.create({ name: '', phone: '+201000000000', email: null, role: null })).toThrow();
  });

  it('throws when phone is empty', () => {
    expect(() => SupplierContact.create({ name: 'Ahmed', phone: '', email: null, role: null })).toThrow();
  });
});
