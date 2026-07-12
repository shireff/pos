import React, { useEffect, useRef, useState } from 'react';
import { Modal, Field } from '../components/ui';
import { Icon } from '../components/Icon';
import { useT } from '../i18n';

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string;
}

export interface CustomerSearchSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: CustomerSearchResult) => void;
  searchFn?: (query: string) => Promise<CustomerSearchResult[]>;
}

export function CustomerSearchSheet({
  open,
  onClose,
  onSelect,
  searchFn,
}: CustomerSearchSheetProps): React.ReactElement {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (searchFn) {
          const data = await searchFn(query);
          setResults(data);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [open, query, searchFn]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('customers.searchTitle')}
      size="lg"
      footer={
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          {t('common.close')}
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Field label={t('customers.searchLabel')} htmlFor="customer-search">
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              ref={inputRef}
              id="customer-search"
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              style={{ paddingRight: 'var(--space-8)' }}
            />
          </div>
        </Field>
        {loading && <div className="loading">{t('customers.searching')}</div>}
        {!loading && results.length === 0 && query.length > 0 && (
          <div className="empty-state">
            <p className="empty-state-title">{t('customers.noCustomersFound')}</p>
            <p>{t('customers.tryDifferentTerm')}</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {results.map((customer) => (
            <div
              key={customer.id}
              className="card"
              style={{
                cursor: 'pointer',
                padding: 'var(--space-3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onClick={() => {
                onSelect(customer);
                onClose();
              }}
              role="button"
              tabIndex={0}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{customer.name}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>{customer.phone}</div>
              </div>
              <Icon name="chevron-left" size={18} />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
