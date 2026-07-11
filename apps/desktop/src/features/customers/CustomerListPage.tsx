import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchCustomers,
  createCustomer,
  selectCustomer,
  redeemLoyalty,
} from '../../lib/store/customersSlice';
import { CustomerCard, LoyaltyTierBadge, LoyaltyRedemptionDialog } from '@packages/ui-components';
import { useToast } from '@packages/ui-components';
import { Modal, Field } from '@packages/ui-components';
import { CustomerProfilePage } from './CustomerProfilePage';

const PAGE_SIZE = 50;

export function CustomerListPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { customers, status, error } = useAppSelector((state: any) => state.customers);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');
  const { push } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [redeemCustomerId, setRedeemCustomerId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchCustomers({ companyId }));
  }, [dispatch, companyId]);

  const filteredCustomers = customers.filter((c: any) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.loyaltyCode ?? '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    try {
      await dispatch(createCustomer({ name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim() || undefined, companyId })).unwrap();
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setIsCreateOpen(false);
      push({ type: 'success', msg: 'Customer created successfully' });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleSelect = (customerId: string) => {
    setSelectedId(customerId);
    dispatch(selectCustomer(null));
  };

  const handleBack = () => {
    setSelectedId(null);
  };

  if (selectedId) {
    return <CustomerProfilePage customerId={selectedId} onBack={handleBack} onRedeem={(id) => setRedeemCustomerId(id)} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer profiles, loyalty, and credit.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          Add Customer
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, phone, or loyalty code"
          aria-label="Search customers"
        />
      </div>

      {isCreateOpen && (
        <div className="card" style={{ marginBlockStart: 'var(--space-3)' }}>
          <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Customer</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Name" required htmlFor="cust-name">
              <input id="cust-name" className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </Field>
            <Field label="Phone" required htmlFor="cust-phone">
              <input id="cust-phone" className="form-input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
            </Field>
            <Field label="Email" htmlFor="cust-email">
              <input id="cust-email" className="form-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {status === 'loading' && customers.length === 0 ? (
        <div className="loading">Loading customers…</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No customers found</p>
          <p>Try a different filter or add a new customer.</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Loyalty Tier</th>
                <th className="table-numeric">Points</th>
                <th className="table-numeric">Credit Balance</th>
                <th className="table-numeric">Credit Limit</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((customer: any) => (
                <tr
                  key={customer.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelect(customer.id)}
                >
                  <td>{customer.name}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{customer.phone}</td>
                  <td><LoyaltyTierBadge tier={customer.loyaltyTierId} /></td>
                  <td className="table-numeric">{customer.loyaltyBalance.toLocaleString()}</td>
                  <td className="table-numeric">{customer.creditBalance.toLocaleString()}</td>
                  <td className="table-numeric">{customer.creditLimitPiasters.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredCustomers.length} items)
            </span>
            <div className="pagination-controls">
              <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      )}

      {redeemCustomerId && (
        <LoyaltyRedemptionDialog
          open={!!redeemCustomerId}
          onClose={() => setRedeemCustomerId(null)}
          customerId={redeemCustomerId}
          availablePoints={customers.find((c: any) => c.id === redeemCustomerId)?.loyaltyBalance ?? 0}
          onConfirm={async (points) => {
            await dispatch(redeemLoyalty({ customerId: redeemCustomerId, points, orderId: undefined }));
          }}
        />
      )}
    </div>
  );
}
