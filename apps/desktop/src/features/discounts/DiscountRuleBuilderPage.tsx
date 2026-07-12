import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchDiscountRules,
  createDiscountRule,
  deactivateDiscountRule,
} from '../../lib/store/promotionsSlice';
import { useToast, Modal, Field, Icon, useT } from '@packages/ui-components';

const DISCOUNT_TYPES = [
  { value: 'item', label: 'Item' },
  { value: 'cart', label: 'Cart' },
  { value: 'category', label: 'Category' },
  { value: 'customer', label: 'Customer' },
  { value: 'membership', label: 'Membership' },
  { value: 'time_based', label: 'Time Based' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y' },
  { value: 'quantity_break', label: 'Quantity Break' },
] as const;

export function DiscountRuleBuilderPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
  const t = useT();
  const { discounts, discountStatus, error } = useAppSelector((state: any) => state.promotions);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('item');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [amount, setAmount] = useState(0);
  const [productIds, setProductIds] = useState('');
  const [categoryIds, setCategoryIds] = useState('');
  const [customerIds, setCustomerIds] = useState('');
  const [tierIds, setTierIds] = useState('');
  const [membershipLevel, setMembershipLevel] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [priority, setPriority] = useState(0);
  const [isExclusive, setIsExclusive] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState('');
  const [getQuantity, setGetQuantity] = useState('');
  const [getDiscountPercent, setGetDiscountPercent] = useState('');
  const [tiers, setTiers] = useState('');

  useEffect(() => {
    void dispatch(fetchDiscountRules({ companyId }));
  }, [dispatch, companyId]);

  const resetForm = () => {
    setName(''); setType('item'); setDiscountType('percentage'); setAmount(0);
    setProductIds(''); setCategoryIds(''); setCustomerIds(''); setTierIds('');
    setMembershipLevel(''); setValidFrom(''); setValidUntil('');
    setPriority(0); setIsExclusive(false);
    setBuyQuantity(''); setGetQuantity(''); setGetDiscountPercent(''); setTiers('');
  };

  const buildRuleJson = (): Record<string, unknown> => {
    const base: Record<string, unknown> = {
      type,
      discountType,
      amount,
      tiers: [] as Array<{ minQuantity: number; discountPercent: number }>,
    };
    switch (type) {
      case 'item':
        base.productIds = productIds.split(',').map((s) => s.trim()).filter(Boolean);
        break;
      case 'cart':
        break;
      case 'category':
        base.categoryIds = categoryIds.split(',').map((s) => s.trim()).filter(Boolean);
        break;
      case 'customer':
        base.customerIds = customerIds.split(',').map((s) => s.trim()).filter(Boolean);
        base.tierIds = tierIds.split(',').map((s) => s.trim()).filter(Boolean);
        break;
      case 'membership':
        base.membershipLevel = membershipLevel || undefined;
        break;
      case 'time_based':
        base.validFrom = validFrom || undefined;
        base.validTo = validUntil || undefined;
        break;
      case 'buy_x_get_y':
        base.buyQuantity = Number(buyQuantity) || undefined;
        base.getQuantity = Number(getQuantity) || undefined;
        base.getDiscountPercent = Number(getDiscountPercent) || undefined;
        break;
      case 'quantity_break':
        base.tiers = tiers.split(';').map((t) => {
          const [minQty, discountPct] = t.split(',').map((s) => Number(s.trim()));
          return { minQuantity: minQty, discountPercent: discountPct };
        }).filter((t) => Number.isFinite(t.minQuantity) && Number.isFinite(t.discountPercent));
        break;
    }
    return base;
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) return;
    try {
      await dispatch(createDiscountRule({
        name: name.trim(),
        type,
        ruleJson: buildRuleJson(),
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
        priority,
        isExclusive,
        companyId,
      })).unwrap();
      push({ type: 'success', msg: t('discounts.ruleCreated') });
      resetForm();
      setIsCreateOpen(false);
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await dispatch(deactivateDiscountRule({ id, companyId })).unwrap();
      push({ type: 'success', msg: t('discounts.ruleDeactivated') });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('discountRules.title')}</h1>
          <p className="page-subtitle">{t('discountRules.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Icon name="plus" size={16} />           {t('discounts.newRule')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {discountStatus === 'loading' && discounts.length === 0 ? (
        <div className="loading">{t('discounts.loadingRules')}</div>
      ) : discounts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{t('discounts.noRules')}</p>
          <p>{t('discounts.createRuleToStart')}</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.type')}</th>
                <th>{t('common.discount')}</th>
                <th>{t('common.priority')}</th>
                <th>{t('discounts.exclusive')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((rule: any) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td>{rule.type}</td>
                  <td>{String(rule.ruleJson.discountType ?? 'percentage')} / {String(rule.ruleJson.amount ?? 0)}</td>
                  <td className="table-numeric">{rule.priority}</td>
                  <td className="table-numeric">{rule.isExclusive ? t('common.yes') : t('common.no')}</td>
                  <td>{rule.isActive ? t('common.active') : t('common.inactive')}</td>
                  <td>
                    {rule.isActive && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDeactivate(rule.id)}>
                        {t('discounts.deactivate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('discountRules.createRule')} footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" form="discount-form" className="btn btn-primary">{t('common.save')}</button>
          </>
        }>
          <form id="discount-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label={t('common.name')} required htmlFor="dr-name">
              <input id="dr-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={t('common.type')} required htmlFor="dr-type">
              <select id="dr-type" className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                {DISCOUNT_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{t('discounts.' + dt.value)}</option>)}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <Field label={t('discounts.discountType')} required htmlFor="dr-discount-type">
                  <select id="dr-discount-type" className="form-input" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}>
                  <option value="percentage">{t('discounts.percentage')}</option>
                  <option value="fixed">{t('discounts.fixed')}</option>
                  </select>
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label={t('common.amount')} required htmlFor="dr-amount">
                  <input id="dr-amount" className="form-input num" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
                </Field>
              </div>
            </div>

            {type === 'item' && (
              <Field label={t('discounts.productIds')} htmlFor="dr-product-ids">
                <input id="dr-product-ids" className="form-input" value={productIds} onChange={(e) => setProductIds(e.target.value)} placeholder={t('discounts.productIdsPlaceholder')} />
              </Field>
            )}
            {type === 'category' && (
              <Field label={t('discounts.categoryIds')} htmlFor="dr-category-ids">
                <input id="dr-category-ids" className="form-input" value={categoryIds} onChange={(e) => setCategoryIds(e.target.value)} placeholder={t('discounts.categoryIdsPlaceholder')} />
              </Field>
            )}
            {type === 'customer' && (
              <>
                <Field label={t('discounts.customerIds')} htmlFor="dr-customer-ids">
                  <input id="dr-customer-ids" className="form-input" value={customerIds} onChange={(e) => setCustomerIds(e.target.value)} placeholder={t('discounts.customerIdsPlaceholder')} />
                </Field>
                <Field label={t('discounts.tierIds')} htmlFor="dr-tier-ids">
                  <input id="dr-tier-ids" className="form-input" value={tierIds} onChange={(e) => setTierIds(e.target.value)} placeholder={t('discounts.tierIdsPlaceholder')} />
                </Field>
              </>
            )}
            {type === 'membership' && (
              <Field label={t('discounts.membershipLevel')} htmlFor="dr-membership">
                <input id="dr-membership" className="form-input" value={membershipLevel} onChange={(e) => setMembershipLevel(e.target.value)} />
              </Field>
            )}
            {type === 'time_based' && (
              <>
                <Field label={t('discounts.validFrom')} htmlFor="dr-valid-from">
                  <input id="dr-valid-from" className="form-input" type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                </Field>
                <Field label={t('discounts.validUntil')} htmlFor="dr-valid-until">
                  <input id="dr-valid-until" className="form-input" type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </Field>
              </>
            )}
            {type === 'buy_x_get_y' && (
              <>
                <Field label={t('discounts.buyQuantity')} htmlFor="dr-buy-qty">
                  <input id="dr-buy-qty" className="form-input num" type="number" min={1} value={buyQuantity} onChange={(e) => setBuyQuantity(e.target.value)} />
                </Field>
                <Field label={t('discounts.getQuantity')} htmlFor="dr-get-qty">
                  <input id="dr-get-qty" className="form-input num" type="number" min={1} value={getQuantity} onChange={(e) => setGetQuantity(e.target.value)} />
                </Field>
                <Field label={t('discounts.discountPercent')} htmlFor="dr-get-pct">
                  <input id="dr-get-pct" className="form-input num" type="number" min={1} max={100} value={getDiscountPercent} onChange={(e) => setGetDiscountPercent(e.target.value)} />
                </Field>
              </>
            )}
            {type === 'quantity_break' && (
              <Field label={t('discounts.tiers')} htmlFor="dr-tiers">
                <textarea id="dr-tiers" className="form-input" value={tiers} onChange={(e) => setTiers(e.target.value)} placeholder={t('discounts.tiersPlaceholder')} rows={3} />
              </Field>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <Field label={t('common.priority')} htmlFor="dr-priority">
                  <input id="dr-priority" className="form-input num" type="number" min={0} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label={t('discounts.exclusive')} htmlFor="dr-exclusive">
                  <input id="dr-exclusive" type="checkbox" checked={isExclusive} onChange={(e) => setIsExclusive(e.target.checked)} />
                </Field>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
