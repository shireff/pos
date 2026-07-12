import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchSuppliers, createSupplier, selectSupplier, deactivateSupplier } from '../../lib/store/suppliersSlice';
import { Field, useToast, useT } from '@packages/ui-components';
import { SupplierProfilePage } from './SupplierProfilePage';

const PAGE_SIZE = 50;

export function SupplierListPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { suppliers, status, error } = useAppSelector((state: any) => state.suppliers);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');
  const { push } = useToast();
  const t = useT();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchSuppliers({ companyId }));
  }, [dispatch, companyId]);

  const filteredSuppliers = suppliers.filter((s: any) => {
    const q = search.toLowerCase();
    return (
      s.name.ar.toLowerCase().includes(q) ||
      (s.name.en ?? '').toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filteredSuppliers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNameAr.trim() || !newPhone.trim()) return;
    try {
      await dispatch(createSupplier({
        name: { ar: newNameAr.trim(), en: newNameEn.trim() || undefined },
        phone: newPhone.trim(),
        companyId,
      })).unwrap();
      setNewNameAr('');
      setNewNameEn('');
      setNewPhone('');
      setIsCreateOpen(false);
      push({ type: 'success', msg: t('suppliers.supplierCreated') });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleSelect = (supplierId: string) => {
    setSelectedId(supplierId);
    dispatch(selectSupplier(null));
  };

  const handleBack = () => {
    setSelectedId(null);
  };

  const handleDeactivate = async (supplierId: string) => {
    try {
      await dispatch(deactivateSupplier({ supplierId, companyId })).unwrap();
      push({ type: 'success', msg: t('suppliers.supplierDeactivated') });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  if (selectedId) {
    return <SupplierProfilePage supplierId={selectedId} onBack={handleBack} onDeactivate={handleDeactivate} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('suppliers.title')}</h1>
          <p className="page-subtitle">{t('suppliers.manageProfiles')}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          {t('suppliers.addSupplier')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('suppliers.searchByNamePhone')}
          aria-label={t('suppliers.searchByNamePhone')}
        />
      </div>

      {isCreateOpen && (
        <div className="card" style={{ marginBlockStart: 'var(--space-3)' }}>
          <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>{t('suppliers.addSupplier')}</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label={t('suppliers.nameAr')} required htmlFor="supp-name-ar">
              <input id="supp-name-ar" className="form-input" value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} required />
            </Field>
            <Field label={t('suppliers.nameEn')} htmlFor="supp-name-en">
              <input id="supp-name-en" className="form-input" value={newNameEn} onChange={(e) => setNewNameEn(e.target.value)} />
            </Field>
            <Field label={t('common.phone')} required htmlFor="supp-phone">
              <input id="supp-phone" className="form-input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary">{t('common.save')}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {status === 'loading' && suppliers.length === 0 ? (
        <div className="loading">{t('suppliers.loadingSuppliers')}</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{t('suppliers.noSuppliersFound')}</p>
          <p>{t('suppliers.tryDifferentFilter')}</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.phone')}</th>
                <th className="table-numeric">{t('suppliers.balance')}</th>
                <th className="table-numeric">{t('suppliers.onTimeRate')}</th>
                <th className="table-numeric">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((supplier: any) => (
                <tr
                  key={supplier.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelect(supplier.id)}
                >
                  <td>{supplier.name.ar} {supplier.name.en ? `(${supplier.name.en})` : ''}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{supplier.phone}</td>
                  <td className="table-numeric">{supplier.balancePiasters.toLocaleString()}</td>
                  <td className="table-numeric">{supplier.onTimeRate.toFixed(1)}%</td>
                  <td className="table-numeric">{supplier.isActive ? t('common.active') : t('common.inactive')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span className="pagination-info">
              {t('suppliers.pageOfItems', { currentPage, totalPages, count: filteredSuppliers.length })}
            </span>
            <div className="pagination-controls">
              <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('suppliers.prev')}</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t('suppliers.next')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
