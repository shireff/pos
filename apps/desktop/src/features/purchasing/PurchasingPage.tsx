import React, { useEffect, useMemo, useState } from 'react';
import { useT, Icon, StatusBadge, Modal, Field, WarehouseSelector } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
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

const STATUS_OPTIONS: Array<{ value: PurchaseOrderFilter['status']; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'partially_received', label: 'Partially received' },
  { value: 'fully_received', label: 'Fully received' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  partially_received: 'Partially received',
  fully_received: 'Fully received',
  cancelled: 'Cancelled',
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
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Create and manage supplier purchase orders.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { clearOcrResult(); setShowForm(true); }}>
          <Icon name="plus" size={16} />
          Create PO
        </button>
      </div>

      <div className="po-filters">
        <input
          className="form-input"
          style={{ maxWidth: 240 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search PO number"
          aria-label="Search purchase orders"
        />
        <input
          className="form-input"
          style={{ maxWidth: 220 }}
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          placeholder="Supplier ID"
          aria-label="Filter by supplier"
        />
        <select
          className="form-input"
          value={statusFilter ?? ''}
          onChange={(e) => {
            const value = (e.target.value || undefined) as PurchaseOrderFilter['status'];
            setStatusFilter(value);
            dispatch(setFilter({ ...filter, status: value }));
          }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value ?? 'all'} value={o.value ?? ''}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              filtered.map((po: PurchaseOrder) => (
                <tr key={po.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(po.id)}>
                  <td className="num">{po.referenceNumber}</td>
                  <td>{po.supplierId}</td>
                  <td>{new Date(po.expectedDeliveryDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={po.status}>{STATUS_LABELS[po.status] ?? po.status}</StatusBadge>
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
        title="Create Purchase Order"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
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
