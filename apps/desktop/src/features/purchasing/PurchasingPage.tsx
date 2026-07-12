import React, { useEffect, useMemo, useState } from 'react';
import { useT, Icon, StatusBadge, Modal } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchPurchaseOrders,
  setFilter,
  clearOcrResult,
  type PurchaseOrder,
  type PurchaseOrderFilter,
  type PurchaseOrderLine,
} from '../../lib/store/purchasingSlice';
import { fetchWarehouses } from '../../lib/store/inventorySlice';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { PurchaseOrderDetailPage } from './PurchaseOrderDetailPage';
import '../../styles/purchasing.css';

const STATUS_OPTIONS: Array<{ value: PurchaseOrderFilter['status']; labelKey: string }> = [
  { value: undefined, labelKey: 'common.all' },
  { value: 'draft', labelKey: 'purchasing.draft' },
  { value: 'pending_approval', labelKey: 'purchasing.pendingApproval' },
  { value: 'approved', labelKey: 'purchasing.approved' },
  { value: 'partially_received', labelKey: 'purchasing.partiallyReceived' },
  { value: 'fully_received', labelKey: 'purchasing.fullyReceived' },
  { value: 'cancelled', labelKey: 'purchasing.cancelled' },
];

const STATUS_LABEL_KEYS: Record<string, string> = {
  draft: 'purchasing.draft',
  pending_approval: 'purchasing.pendingApproval',
  approved: 'purchasing.approved',
  partially_received: 'purchasing.partiallyReceived',
  fully_received: 'purchasing.fullyReceived',
  cancelled: 'purchasing.cancelled',
};

export function PurchasingPage(): React.ReactElement {
  const t = useT();
  const dispatch = useAppDispatch();
  const { purchaseOrders, filter, status } = useAppSelector((s) => s.purchasing);
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? 'company-1');
  const branchId = 'branch-1';

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderFilter['status']>(filter.status);

  useEffect(() => {
    dispatch(fetchPurchaseOrders(filter));
  }, [dispatch, filter]);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const filtered = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (search && !po.referenceNumber.toLowerCase().includes(search.toLowerCase())) return false;
      if (supplierFilter && po.supplierId !== supplierFilter) return false;
      return true;
    });
  }, [purchaseOrders, search, supplierFilter]);

  if (view === 'detail' && selectedId) {
    return (
      <PurchaseOrderDetailPage
        purchaseOrderId={selectedId}
        onBack={() => {
          setView('list');
          setSelectedId(null);
          dispatch(fetchPurchaseOrders(filter));
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('purchaseOrders.title')}</h1>
          <p className="page-subtitle">{t('purchasing.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { clearOcrResult(); setShowForm(true); }}>
          <Icon name="plus" size={16} />
          {t('purchasing.createPo')}
        </button>
      </div>

      <div className="po-filters">
        <input
          className="form-input"
          style={{ maxWidth: 240 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('purchasing.searchPoPlaceholder')}
          aria-label={t('purchasing.searchPo')}
        />
        <input
          className="form-input"
          style={{ maxWidth: 220 }}
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          placeholder={t('purchasing.supplierPlaceholder')}
          aria-label={t('purchasing.filterBySupplier')}
        />
        <select
          className="form-input"
          value={statusFilter ?? ''}
          onChange={(e) => {
            const value = (e.target.value || undefined) as PurchaseOrderFilter['status'];
            setStatusFilter(value);
            dispatch(setFilter({ ...filter, status: value }));
          }}
          aria-label={t('purchasing.filterByStatus')}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value ?? 'all'} value={o.value ?? ''}>
              {t(o.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('purchasing.poNumber')}</th>
              <th>{t('purchasing.supplier')}</th>
              <th>{t('purchasing.date')}</th>
              <th>{t('purchasing.status')}</th>
              <th>{t('purchasing.total')}</th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && filtered.length === 0 ? (
               <tr><td colSpan={5} style={{ textAlign: 'center' }}>{t('common.loading')}</td></tr>
             ) : filtered.length === 0 ? (
               <tr>
                 <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                   {t('purchasing.noOrders')}
                 </td>
               </tr>
             ) : (
               filtered.map((po: PurchaseOrder) => (
                 <tr key={po.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(po.id)}>
                   <td className="num">{po.referenceNumber}</td>
                   <td>{po.supplierId}</td>
                   <td>{new Date(po.expectedDeliveryDate).toLocaleDateString()}</td>
                   <td>
                     <StatusBadge status={po.status}>{t(STATUS_LABEL_KEYS[po.status] ?? po.status)}</StatusBadge>
                   </td>
                  <td className="num">{(po.totalAmountPiasters / 100).toFixed(2)} EGP</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={t('purchasing.createPo')}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t('purchasing.cancel')}</button>
          </>
        }
      >
        <PurchaseOrderForm
          companyId={companyId}
          branchId={branchId}
          onCreated={(po) => {
            setShowForm(false);
            openDetail(po.id);
          }}
        />
      </Modal>
    </div>
  );
}

export type { PurchaseOrderLine };
