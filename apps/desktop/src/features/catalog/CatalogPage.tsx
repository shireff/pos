import React, { useEffect, useState } from 'react';
import {
  ProductCard,
  VariantBadge,
  UnitSelector,
  BarcodeDisplay,
  useT,
  Icon,
  StatusBadge,
  StatCard,
  EmptyState,
} from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  selectProduct, fetchProducts, fetchProductById, updateProduct,
  createProduct, archiveProduct, generateBarcode, addVariant,
  fetchCategories, createCategory, moveCategory, fetchUnits, clearProductDetail,
} from '../../lib/store/catalogSlice';
import {
  fetchSubscription, upgradeSubscription, registerDevice, fetchHealth,
} from '../../lib/store/systemSlice';
import { fetchMe } from '../../lib/store/authSlice';
import '../../styles/catalog.css';

type SubTab = 'dashboard' | 'products' | 'categories' | 'units' | 'system';

interface PlanOption {
  id: string;
  label: string;
  price: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanOption[] = [
  { id: 'basic', label: 'Basic', price: '600 EGP/m', features: ['1 نقطة بيع', 'نسخ احتياطي'] },
  { id: 'pro', label: 'Pro', price: '1,200 EGP/m', features: ['نقاط غير محدودة', 'مزامنة سحابية'], highlight: true },
  { id: 'enterprise', label: 'Enterprise', price: 'اتصل بنا', features: ['متعدد الفروع', 'ذكاء اصطناعي'] },
];

export function CatalogPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.catalog.products);
  const selectedProductId = useAppSelector((s) => s.catalog.selectedProductId);
  const selectedProductDetail = useAppSelector((s) => s.catalog.selectedProductDetail);
  const detailStatus = useAppSelector((s) => s.catalog.detailStatus);
  const categories = useAppSelector((s) => s.catalog.categories);
  const units = useAppSelector((s) => s.catalog.units);
  const auth = useAppSelector((s) => s.auth);
  const system = useAppSelector((s) => s.system);
  const companyId = auth.user?.companyId ?? 'company-1';

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductCat, setNewProductCat] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newCatAr, setNewCatAr] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [moveCatId, setMoveCatId] = useState('');
  const [moveParentId, setMoveParentId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchProducts({ companyId }));
    void dispatch(fetchCategories({ companyId }));
    void dispatch(fetchUnits({ companyId }));
    void dispatch(fetchSubscription());
    void dispatch(fetchHealth());
    void dispatch(fetchMe());
  }, [dispatch, companyId]);

  useEffect(() => {
    if (selectedProductId) void dispatch(fetchProductById(selectedProductId));
    else dispatch(clearProductDetail());
  }, [dispatch, selectedProductId]);

  useEffect(() => {
    if (selectedProductDetail && !editMode) {
      setEditName(selectedProductDetail.name);
      setEditDesc(selectedProductDetail.description ?? '');
    }
  }, [selectedProductDetail, editMode]);

  const setErr = (err: unknown) => setActionError(String(err));
  const clrErr = () => setActionError(null);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    clrErr();
    try {
      await dispatch(createProduct({ name: newProductName, description: newProductDesc, categoryId: newProductCat || undefined, companyId })).unwrap();
      setNewProductName(''); setNewProductDesc(''); setNewProductCat('');
      void dispatch(fetchProducts({ companyId }));
    } catch (err) { setErr(err); }
  };

  const handleSaveEdit = async () => {
    if (!selectedProductId) return;
    clrErr();
    try {
      await dispatch(updateProduct({ id: selectedProductId, name: editName, description: editDesc })).unwrap();
      setEditMode(false);
    } catch (err) { setErr(err); }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariantLabel.trim() || !selectedProductId) return;
    clrErr();
    try {
      await dispatch(addVariant({ productId: selectedProductId, label: newVariantLabel })).unwrap();
      setNewVariantLabel(''); setShowVariantForm(false);
    } catch (err) { setErr(err); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatAr.trim()) return;
    clrErr();
    try {
      await dispatch(createCategory({ name: { ar: newCatAr, en: newCatEn }, companyId })).unwrap();
      setNewCatAr(''); setNewCatEn('');
      void dispatch(fetchCategories({ companyId }));
    } catch (err) { setErr(err); }
  };

  const handleMoveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveCatId) return;
    clrErr();
    try {
      await dispatch(moveCategory({ categoryId: moveCatId, newParentId: moveParentId || null })).unwrap();
      setMoveCatId(''); setMoveParentId('');
      void dispatch(fetchCategories({ companyId }));
    } catch (err) { setErr(err); }
  };

  const handleRegisterDevice = async () => {
    clrErr();
    try {
      await dispatch(registerDevice({ companyId, deviceType: 'desktop', deviceFingerprint: `desktop-${companyId}-${Date.now()}` })).unwrap();
    } catch (err) { setErr(err); }
  };

  const handleUpgrade = async (planId: string) => {
    clrErr();
    try {
      await dispatch(upgradeSubscription({ planId, billingCycle: 'monthly' })).unwrap();
    } catch (err) { setErr(err); }
  };

  const resolvedUnit = (selectedUnit || units[0]?.id) ?? '';
  const lowStockCount = products.filter((p) => p.stockLabel?.toLowerCase().includes('low')).length;
  const subStatus = system.subscription?.status;

  const tabs: { id: SubTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { id: 'dashboard', label: t('dash.title'), icon: 'home' },
    { id: 'products', label: t('catalog.products'), icon: 'package' },
    { id: 'categories', label: t('categories.title'), icon: 'tag' },
    { id: 'units', label: t('units.title'), icon: 'layers' },
    { id: 'system', label: t('system.subscription'), icon: 'settings' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('app.name')}</h1>
          <p className="page-subtitle">{t('dash.subtitle')}</p>
        </div>
        <div className="page-actions">
          <span className="badge badge-success">
            <Icon name="wifi" size={14} />
            {system.health?.dbConnected ? t('health.connected') : t('health.disconnected')}
          </span>
          <button type="button" className="btn btn-primary btn-sm">
            <Icon name="plus" size={16} />
            {t('catalog.addProduct')}
          </button>
        </div>
      </div>

      {actionError && <div className="error-banner" style={{ marginBlockEnd: 'var(--space-4)' }}>{actionError}</div>}

      {/* Tabs */}
      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={activeSubTab === tab.id}
            className={`tab${activeSubTab === tab.id ? ' is-active' : ''}`} onClick={() => setActiveSubTab(tab.id)}>
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {activeSubTab === 'dashboard' && (
        <div className="stack">
          <div className="grid-auto">
            <StatCard label={t('catalog.products')} value={products.length} icon={<Icon name="package" size={18} />} />
            <StatCard label={t('categories.title')} value={categories.length} icon={<Icon name="tag" size={18} />} />
            <StatCard label={t('units.title')} value={units.length} icon={<Icon name="layers" size={18} />} />
            <StatCard
              label={t('system.subscriptionStatus')}
              value={subStatus ? t(`status.${subStatus}`) : '—'}
              icon={<Icon name="shield" size={18} />}
              accent
            />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">{t('catalog.products')}</h2>
                <span className="badge">{products.length}</span>
              </div>
              <div className="card-body stack">
                {products.length === 0 ? (
                  <EmptyState icon={<Icon name="package" size={24} />} title={t('catalog.noProducts')} desc={t('empty.addFirst')} />
                ) : (
                  products.slice(0, 6).map((p) => (
                    <button key={p.id} type="button"
                      className={`product-card-btn${p.id === selectedProductId ? ' product-card-btn--selected' : ''}`}
                      onClick={() => { dispatch(selectProduct(p.id)); setActiveSubTab('products'); }}>
                      <ProductCard {...p} />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="stack">
              <div className="card">
                <div className="card-header"><h2 className="card-title">{t('dash.inventoryAlerts')}</h2></div>
                <div className="card-body">
                  {lowStockCount === 0 ? (
                    <div className="row"><Icon name="check-circle" size={18} style={{ color: 'var(--color-success)' }} /><span>{t('dash.inventoryAlerts')}: 0</span></div>
                  ) : (
                    <div className="row"><Icon name="alert-triangle" size={18} style={{ color: 'var(--color-warning)' }} /><span>{lowStockCount} {t('dash.lowStock')}</span></div>
                  )}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h2 className="card-title">{t('dash.connectedDevices')}</h2></div>
                <div className="card-body">
                  <div className="status-row">
                    <span className="status-label">{t('more.device')}</span>
                    {system.registeredDevice ? (
                      <StatusBadge status="active">{system.registeredDevice.deviceFingerprint}</StatusBadge>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleRegisterDevice}>{t('system.registerDevice')}</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Products Tab ── */}
      {activeSubTab === 'products' && (
        <div className="split-layout">
          <div className="section">
            <h2 className="panel-header">{t('catalog.productCount', { count: products.length })}</h2>
            {products.length === 0 && <EmptyState icon={<Icon name="package" size={24} />} title={t('catalog.noProducts')} />}
            {products.map((p) => (
              <button key={p.id} type="button"
                className={`product-card-btn${p.id === selectedProductId ? ' product-card-btn--selected' : ''}`}
                onClick={() => dispatch(selectProduct(p.id))}>
                <ProductCard {...p} />
              </button>
            ))}
            <form onSubmit={handleCreateProduct} className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)' }}>
              <span className="section-label">{t('catalog.newProduct')}</span>
              <div className="form-field">
                <label className="form-label" htmlFor="np-name">{t('catalog.productName')} *</label>
                <input id="np-name" className="form-input" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} required />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="np-desc">{t('catalog.description')}</label>
                <input id="np-desc" className="form-input" value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="np-cat">{t('catalog.category')}</label>
                <select id="np-cat" className="form-select" value={newProductCat} onChange={(e) => setNewProductCat(e.target.value)}>
                  <option value="">{t('catalog.noCategory')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name.ar}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">{t('common.save')}</button>
            </form>
          </div>

          <div className="card section">
            {detailStatus === 'loading' && <div className="loading">{t('common.loading')}</div>}
            {!selectedProductDetail && detailStatus !== 'loading' && <EmptyState icon={<Icon name="package" size={24} />} title={t('catalog.selectProduct')} />}
            {selectedProductDetail && detailStatus !== 'loading' && (
              <>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 className="card-title">{selectedProductDetail.name}</h2>
                    <p className="sku" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {selectedProductDetail.sku}
                    </p>
                  </div>
                  <StatusBadge status={selectedProductDetail.status} />
                </div>

                <div className="section">
                  <span className="section-label">{t('catalog.editInfo')}</span>
                  {editMode ? (
                    <div className="section">
                      <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t('catalog.productName')} />
                      <input className="form-input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder={t('catalog.description')} />
                      <div className="row">
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveEdit}>{t('common.save')}</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)}>{t('common.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>
                      {t('catalog.editNameDesc')}
                    </button>
                  )}
                </div>

                {selectedProductDetail.description && (
                  <div className="section">
                    <span className="section-label">{t('catalog.description')}</span>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {selectedProductDetail.description}
                    </p>
                  </div>
                )}

                <div className="section">
                  <div className="row-between">
                    <span className="section-label">{t('catalog.variants')}</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowVariantForm((v) => !v)}>
                      <Icon name="plus" size={14} />
                      {showVariantForm ? t('common.close') : t('catalog.addVariant')}
                    </button>
                  </div>
                  {showVariantForm && (
                    <form onSubmit={handleAddVariant} className="row">
                      <input className="form-input" placeholder={t('catalog.variantName')} value={newVariantLabel} onChange={(e) => setNewVariantLabel(e.target.value)} required />
                      <button type="submit" className="btn btn-primary btn-sm">{t('common.add')}</button>
                    </form>
                  )}
                  <div className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {selectedProductDetail.variants.length === 0
                      ? <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{t('catalog.noVariants')}</span>
                      : selectedProductDetail.variants.map((v) => <VariantBadge key={v.id} label={v.label} />)}
                  </div>
                </div>

                <div className="section">
                  <span className="section-label">{t('catalog.units')}</span>
                  <UnitSelector
                    units={units.map((u) => ({ id: u.id, label: u.unitName, conversionLabel: `×${u.conversionFactorToBase}` }))}
                    selectedUnit={resolvedUnit}
                    onSelect={setSelectedUnit}
                  />
                </div>

                {selectedProductDetail.stock && (
                  <div className="section">
                    <span className="section-label">{t('catalog.stock')}</span>
                    <div className="grid-3">
                      <div className="stat-card">
                        <span className="stat-label">{t('catalog.stockIn')}</span>
                        <span className="stat-value" style={{ color: 'var(--color-success)' }}>{selectedProductDetail.stock.totalIn}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">{t('catalog.stockOut')}</span>
                        <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{selectedProductDetail.stock.totalOut}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">{t('catalog.stockBalance')}</span>
                        <span className="stat-value">{selectedProductDetail.stock.balance}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="section">
                  <span className="section-label">{t('catalog.barcode')}</span>
                  <BarcodeDisplay value={selectedProductDetail.barcode ?? selectedProductDetail.id} />
                  <div className="row" style={{ marginTop: 'var(--space-2)' }}>
                    <button type="button" className="btn btn-secondary btn-sm"
                      onClick={() => void dispatch(generateBarcode(selectedProductDetail.id))}>
                      <Icon name="qr" size={14} />
                      {t('catalog.generateBarcode')}
                    </button>
                    <button type="button" className="btn btn-danger btn-sm"
                      onClick={() => void dispatch(archiveProduct(selectedProductDetail.id))}>
                      <Icon name="archive" size={14} />
                      {t('catalog.archive')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Categories Tab ── */}
      {activeSubTab === 'categories' && (
        <div className="grid-2">
          <div className="section">
            <h2 className="panel-header">{t('categories.categoryCount', { count: categories.length })}</h2>
            {categories.length === 0
              ? <EmptyState icon={<Icon name="tag" size={24} />} title={t('categories.noCategories')} />
              : categories.map((c) => (
                <div key={c.id} className="category-row">
                  <span><strong>{c.name.ar}</strong>{c.name.en ? ` (${c.name.en})` : ''}</span>
                  <span className="badge badge-draft">{t('categories.level')} {c.level}</span>
                </div>
              ))}
          </div>
          <div className="section">
            <form onSubmit={handleCreateCategory} className="card" style={{ padding: 'var(--space-4)' }}>
              <span className="section-label">{t('categories.newCategory')}</span>
              <div className="form-field">
                <label className="form-label" htmlFor="cat-ar">{t('categories.nameAr')} *</label>
                <input id="cat-ar" className="form-input" value={newCatAr} onChange={(e) => setNewCatAr(e.target.value)} required />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="cat-en">{t('categories.nameEn')}</label>
                <input id="cat-en" className="form-input" value={newCatEn} onChange={(e) => setNewCatEn(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">{t('common.create')}</button>
            </form>
            <form onSubmit={handleMoveCategory} className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)' }}>
              <span className="section-label">{t('categories.moveCategory')}</span>
              <div className="form-field">
                <label className="form-label" htmlFor="mv-cat">{t('categories.categoryToMove')}</label>
                <select id="mv-cat" className="form-select" value={moveCatId} onChange={(e) => setMoveCatId(e.target.value)} required>
                  <option value="">{t('common.select')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name.ar}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="mv-parent">{t('categories.newParent')}</label>
                <select id="mv-parent" className="form-select" value={moveParentId} onChange={(e) => setMoveParentId(e.target.value)}>
                  <option value="">{t('categories.rootLevel')}</option>
                  {categories.filter((c) => c.id !== moveCatId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name.ar}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-secondary" disabled={!moveCatId}>{t('common.confirm')}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Units Tab ── */}
      {activeSubTab === 'units' && (
        <div className="table-container">
          <div className="table-toolbar">
            <h2 className="panel-header" style={{ border: 0, padding: 0, flex: 1 }}>{t('units.count', { count: units.length })}</h2>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('units.abbreviation')}</th>
                  <th>{t('units.baseUnit')}</th>
                  <th className="table-numeric">{t('units.conversionFactor')}</th>
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr><td colSpan={3} className="table-empty">{t('units.noUnits')}</td></tr>
                ) : (
                  units.map((u) => (
                    <tr key={u.id}>
                      <td>{u.unitName}</td>
                      <td>{u.isBaseUnit ? <StatusBadge status="active">{t('common.yes')}</StatusBadge> : <span className="badge badge-draft">{t('common.no')}</span>}</td>
                      <td className="table-numeric num">{u.conversionFactorToBase}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── System Tab ── */}
      {activeSubTab === 'system' && (
        <div className="grid-2">
          <div className="section">
            <h2 className="panel-header">{t('system.plans')}</h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBlockEnd: 'var(--space-4)' }}>
              {t('system.currentPlan')}: <strong>{system.subscription?.planId ?? 'تجريبية'}</strong>
            </p>
            <div className="plans-grid">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`plan-card${plan.highlight ? ' plan-card--highlighted' : ''}`}>
                  {plan.highlight && (
                    <span className="badge badge-active plan-card__badge">{t('system.mostPopular')}</span>
                  )}
                  <h4 className="plan-card__name">{plan.label}</h4>
                  <p className="plan-card__price num">{plan.price}</p>
                  <ul className="plan-card__features">
                    {plan.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <button
                    type="button"
                    className={`btn btn-sm plan-card__btn${plan.highlight ? ' btn-primary' : ' btn-secondary'}`}
                    onClick={() => void handleUpgrade(plan.id)}
                    disabled={system.subscription?.planId === plan.id}
                  >
                    {system.subscription?.planId === plan.id ? t('system.currentPlanBadge') : t('system.upgrade')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h2 className="panel-header">{t('system.deviceRegistration')}</h2>
            <div className="device-box">
              <p className="device-box__desc">{t('system.deviceDesc')}</p>
              <button
                type="button"
                className={`btn btn-lg${system.registeredDevice ? ' btn-secondary' : ' btn-primary'}`}
                style={{ width: '100%' }}
                onClick={handleRegisterDevice}
              >
                <Icon name="smartphone" size={18} />
                {system.registeredDevice ? t('system.reregister') : t('system.registerDevice')}
              </button>
              {system.registeredDevice && (
                <p className="device-box__fingerprint">
                  {t('more.device')}: <strong>{system.registeredDevice.id}</strong>
                </p>
              )}
            </div>

            <div className="permissions-box">
              <p className="permissions-box__title">{t('system.permissions')}</p>
              <p className="permissions-box__roles">
                {t('system.roles')}:{' '}
                {auth.branchRoles.length > 0
                  ? auth.branchRoles.join(', ')
                  : t('system.defaultRoles')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
