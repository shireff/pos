import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
    fetchCustomers,
    createCustomer,
    selectCustomer,
} from '../../lib/store/customersSlice';
import { useToast, useT, Field } from '@packages/ui-components';
import { CustomerProfilePage } from './CustomerProfilePage';

const PAGE_SIZE = 50;

export function CustomerListPage(): React.ReactElement {
    const dispatch = useAppDispatch();
    const t = useT();
    const { customers, status, error } = useAppSelector((s: any) => s.customers);
    const companyId = useAppSelector((s: any) => s.auth.user?.companyId ?? 'company-1');
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

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
            push({ type: 'success', msg: t('customers.customerCreated') });
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
        return <CustomerProfilePage customerId={selectedId} onBack={handleBack} />;
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('customers.customers')}</h1>
                    <p className="page-subtitle">{t('customers.manageProfilesLoyaltyCredit')}</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                    {t('customers.addCustomer')}
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <input
                    className="form-input"
                    style={{ maxWidth: 280 }}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder={t('customers.searchByNamePhoneLoyalty')}
                    aria-label="Search customers"
                />
            </div>

            {isCreateOpen && (
                <div className="card" style={{ marginBlockStart: 'var(--space-3)' }}>
                    <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>{t('customers.addCustomer')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <Field label={t('customers.name')} required htmlFor="cust-name">
                            <input id="cust-name" className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                        </Field>
                        <Field label={t('customers.phone')} required htmlFor="cust-phone">
                            <input id="cust-phone" className="form-input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
                        </Field>
                        <Field label={t('customers.email')} htmlFor="cust-email">
                            <input id="cust-email" className="form-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                        </Field>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            {status === 'loading' && customers.length === 0 ? (
                <div className="loading">{t('customers.loadingCustomers')}</div>
            ) : filteredCustomers.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-state-title">{t('customers.noCustomersFound')}</p>
                    <p>{t('customers.tryDifferentFilter')}</p>
                </div>
            ) : (
                <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('customers.name')}</th>
                                <th>{t('customers.phone')}</th>
                                <th>{t('customers.loyaltyTier')}</th>
                                <th className="table-numeric">{t('customers.points')}</th>
                                <th className="table-numeric">{t('customers.creditBalance')}</th>
                                <th className="table-numeric">{t('customers.creditLimit')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map((customer: any) => (
                                <tr key={customer.id} style={{ cursor: 'pointer' }} onClick={() => handleSelect(customer.id)}>
                                    <td>{customer.name}</td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{customer.phone}</td>
                                    <td><span className={`badge badge-${customer.loyaltyTierId}`}>{customer.loyaltyTierId}</span></td>
                                    <td className="table-numeric">{customer.loyaltyBalance.toLocaleString()}</td>
                                    <td className="table-numeric">{customer.creditBalance.toLocaleString()}</td>
                                    <td className="table-numeric">{customer.creditLimitPiasters.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination">
                        <span className="pagination-info">
                            {t('customers.pageOf')} {currentPage} {t('common.of')} {totalPages} ({filteredCustomers.length} {t('customers.items')})
                        </span>
                        <div className="pagination-controls">
                            <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('customers.prev')}</button>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t('customers.next')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
