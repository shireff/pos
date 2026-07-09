import { useEffect, useState } from 'react';
import { BarcodeDisplay, VariantBadge, useT, Icon, StatusBadge } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchProducts, fetchProductById, fetchProductVariants,
  fetchProductStock, fetchCategories, selectProduct,
  createProduct, archiveProduct, generateBarcode,
  addVariant, clearProductDetail,
} from '../../lib/store/catalogSlice';

export function ProductListPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const { products, selectedProductId, selectedProductDetail, detailStatus, status } =
    useAppSelector((s) => s.catalog);
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? '');

  const [search, setSearch] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      void dispatch(fetchProducts({ companyId }));
      void dispatch(fetchCategories({ companyId }));
    }
  }, [dispatch, companyId]);

  useEffect(() => {
    if (selectedProductId) {
      void dispatch(fetchProductById(selectedProductId));
      void dispatch(fetchProductVariants(selectedProductId));
      void dispatch(fetchProductStock(selectedProductId));
      setShowDetail(true);
    } else {
      dispatch(clearProductDetail());
      setShowDetail(false);
    }
  }, [dispatch, selectedProductId]);

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectProduct = (id: string) => {
    dispatch(selectProduct(id));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !companyId) return;
    setActionError(null);
    try {
      await dispatch(createProduct({ name: newName, description: newDesc, companyId })).unwrap();
      setNewName(''); setNewDesc(''); setShowAddForm(false);
    } catch (err) { setActionError(String(err)); }
  };

  const handleArchive = async () => {
    if (!selectedProductId) return;
    setActionError(null);
    try {
      await dispatch(archiveProduct(selectedProductId)).unwrap();
      dispatch(selectProduct(''));
      setShowDetail(false);
    } catch (err) { setActionError(String(err)); }
  };

  const handleGenerateBarcode = async () => {
    if (!selectedProductId) return;
    setActionError(null);
    try {
      await dispatch(generateBarcode(selectedProductId)).unwrap();
    } catch (err) { setActionError(String(err)); }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newVariantLabel.trim()) return;
    setActionError(null);
    try {
      await dispatch(addVariant({ productId: selectedProductId, label: newVariantLabel })).unwrap();
      setNewVariantLabel(''); setShowVariantForm(false);
    } catch (err) { setActionError(String(err)); }
  };

  if (showDetail && selectedProductDetail) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => { dispatch(selectProduct('')); setShowDetail(false); }}>
            <Icon name="chevron-left" size={16} />
            {t('common.back')}
          </button>
          <h1 className="page-title" style={{ fontSize: 'var(--font-size-lg)' }}>{selectedProductDetail.name}</h1>
        </div>

        {actionError && <div className="error-banner">{actionError}</div>}
        {detailStatus === 'loading' && <div className="loading">{t('common.loading')}</div>}

        {detailStatus !== 'loading' && (
          <>
            <div className="card">
              <div className="row-between">
                <StatusBadge status={selectedProductDetail.status} />
                <span className="sku" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{selectedProductDetail.sku}</span>
              </div>
              {selectedProductDetail.description && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>{selectedProductDetail.description}</p>
              )}
            </div>

            <div className="card">
              <p className="section-label" style={{ marginBlockEnd: 'var(--space-3)' }}>{t('catalog.barcode')}</p>
              <BarcodeDisplay value={selectedProductDetail.barcode ?? selectedProductDetail.id} />
              <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-3)' }} onClick={handleGenerateBarcode}>
                <Icon name="qr" size={16} />
                {t('catalog.generateBarcode')}
              </button>
            </div>

            <div className="card">
              <div className="row-between">
                <p className="section-label">{t('catalog.variants')}</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowVariantForm((v) => !v)}>
                  <Icon name="plus" size={14} />
                  {showVariantForm ? t('common.close') : t('catalog.addVariant')}
                </button>
              </div>
              {showVariantForm && (
                <form onSubmit={handleAddVariant} className="row" style={{ marginBlockEnd: 'var(--space-3)' }}>
                  <input className="form-input" style={{ flex: 1 }} placeholder={t('catalog.variantName')} value={newVariantLabel} onChange={(e) => setNewVariantLabel(e.target.value)} required />
                  <button type="submit" className="btn btn-primary btn-sm">{t('common.add')}</button>
                </form>
              )}
              <div className="row" style={{ gap: 'var(--space-2)' }}>
                {selectedProductDetail.variants.length === 0
                  ? <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{t('catalog.noVariants')}</p>
                  : selectedProductDetail.variants.map((v) => <VariantBadge key={v.id} label={v.label} />)}
              </div>
            </div>

            {selectedProductDetail.stock && (
              <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-2)' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{t('catalog.stockIn')}</p>
                  <p className="num" style={{ fontWeight: 700, color: 'var(--color-success)' }}>{selectedProductDetail.stock.totalIn}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{t('catalog.stockOut')}</p>
                  <p className="num" style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{selectedProductDetail.stock.totalOut}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{t('catalog.stockBalance')}</p>
                  <p className="num" style={{ fontWeight: 700 }}>{selectedProductDetail.stock.balance}</p>
                </div>
              </div>
            )}

            <button className="btn btn-danger btn-block" onClick={handleArchive}>
              <Icon name="archive" size={16} />
              {t('catalog.archive')}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{t('catalog.products')}</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm((v) => !v)}>
          <Icon name="plus" size={16} />
          {showAddForm ? t('common.close') : t('catalog.addProduct')}
        </button>
      </div>

      {actionError && <div className="error-banner">{actionError}</div>}

      {showAddForm && (
        <form onSubmit={handleCreateProduct} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontWeight: 700 }}>{t('catalog.newProduct')}</p>
          <div className="form-field">
            <label className="form-label" htmlFor="prod-name-m">{t('catalog.productName')} *</label>
            <input id="prod-name-m" className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="prod-desc-m">{t('catalog.description')}</label>
            <input id="prod-desc-m" className="form-input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <div className="row">
            <button type="submit" className="btn btn-primary btn-sm">{t('common.save')}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>{t('common.cancel')}</button>
          </div>
        </form>
      )}

      <div className="search-bar">
        <span className="search-bar__icon"><Icon name="search" size={18} /></span>
        <input
          className="search-input"
          placeholder={t('catalog.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('common.search')}
        />
      </div>

      {status === 'loading' && products.length === 0 && <div className="loading">{t('common.loading')}</div>}

      {!status || (status !== 'loading' && filtered.length === 0) ? (
        <div className="empty-state">
          <span className="empty-state__icon"><Icon name="package" size={24} /></span>
          <p className="empty-state-title">{t('catalog.noProducts')}</p>
          <p>{t('empty.addFirst')}</p>
        </div>
      ) : (
        <div className="card-list">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              className="card"
              style={{
                width: '100%', textAlign: 'start', cursor: 'pointer',
                background: selectedProductId === product.id ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                borderColor: selectedProductId === product.id ? 'var(--color-primary)' : 'var(--color-border)',
              }}
              onClick={() => handleSelectProduct(product.id)}
            >
              <div className="row-between">
                <div>
                  <p style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{product.name}</p>
                  <p className="sku" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{product.sku}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
                  <StatusBadge status={product.status} />
                  <span className="num" style={{ fontSize: 'var(--font-size-sm)', color: product.stockLabel === 'Low stock' ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>{product.stockLabel}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
