import React, { useEffect, useState } from 'react';
import { ProductCard, VariantBadge, UnitSelector, BarcodeDisplay } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  selectProduct,
  fetchProducts,
  fetchProductById,
  updateProduct,
  createProduct,
  archiveProduct,
  generateBarcode,
  addVariant,
  fetchCategories,
  createCategory,
  moveCategory,
  fetchUnits,
  clearProductDetail,
} from '../../lib/store/catalogSlice';
import {
  fetchSubscription,
  upgradeSubscription,
  registerDevice,
  fetchHealth,
} from '../../lib/store/systemSlice';
import { fetchMe } from '../../lib/store/authSlice';

export function CatalogPage() {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.catalog.products);
  const selectedProductId = useAppSelector((state) => state.catalog.selectedProductId);
  const selectedProductDetail = useAppSelector((state) => state.catalog.selectedProductDetail);
  const detailStatus = useAppSelector((state) => state.catalog.detailStatus);
  const categories = useAppSelector((state) => state.catalog.categories);
  const units = useAppSelector((state) => state.catalog.units);

  const auth = useAppSelector((state) => state.auth);
  const system = useAppSelector((state) => state.system);
  const companyId = auth.user?.companyId ?? 'company-1';

  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'units' | 'system'>(
    'products',
  );
  const [selectedUnit, setSelectedUnit] = useState('pcs');

  // Form states – create product
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductCat, setNewProductCat] = useState('');

  // Edit product inline
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Add variant form
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [showVariantForm, setShowVariantForm] = useState(false);

  // Category forms
  const [newCatAr, setNewCatAr] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [moveCatId, setMoveCatId] = useState('');
  const [moveParentId, setMoveParentId] = useState('');

  // Initial data load
  useEffect(() => {
    void dispatch(fetchProducts({ companyId }));
    void dispatch(fetchCategories({ companyId }));
    void dispatch(fetchUnits({ companyId }));
    void dispatch(fetchSubscription());
    void dispatch(fetchHealth());
    void dispatch(fetchMe());
  }, [dispatch, companyId]);

  // Load full detail when selection changes
  useEffect(() => {
    if (selectedProductId) {
      void dispatch(fetchProductById(selectedProductId));
    } else {
      dispatch(clearProductDetail());
    }
  }, [dispatch, selectedProductId]);

  // Sync edit form with loaded detail
  useEffect(() => {
    if (selectedProductDetail && !editMode) {
      setEditName(selectedProductDetail.name);
      setEditDesc(selectedProductDetail.description ?? '');
    }
  }, [selectedProductDetail, editMode]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    try {
      await dispatch(
        createProduct({
          name: newProductName,
          description: newProductDesc,
          categoryId: newProductCat || undefined,
          companyId,
        }),
      ).unwrap();
      setNewProductName('');
      setNewProductDesc('');
      setNewProductCat('');
      void dispatch(fetchProducts({ companyId }));
    } catch (err) {
      alert(`فشل الإنشاء: ${String(err)}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProductId) return;
    try {
      await dispatch(
        updateProduct({
          id: selectedProductId,
          name: editName,
          description: editDesc,
        }),
      ).unwrap();
      setEditMode(false);
    } catch (err) {
      alert(`فشل التحديث: ${String(err)}`);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariantLabel.trim() || !selectedProductId) return;
    try {
      await dispatch(addVariant({ productId: selectedProductId, label: newVariantLabel })).unwrap();
      setNewVariantLabel('');
      setShowVariantForm(false);
    } catch (err) {
      alert(`فشل الإضافة: ${String(err)}`);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatAr.trim()) return;
    try {
      await dispatch(createCategory({ name: { ar: newCatAr, en: newCatEn }, companyId })).unwrap();
      setNewCatAr('');
      setNewCatEn('');
      void dispatch(fetchCategories({ companyId }));
    } catch (err) {
      alert(`فشل الإنشاء: ${String(err)}`);
    }
  };

  const handleMoveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveCatId) return;
    try {
      await dispatch(
        moveCategory({ categoryId: moveCatId, newParentId: moveParentId || null }),
      ).unwrap();
      setMoveCatId('');
      setMoveParentId('');
      void dispatch(fetchCategories({ companyId }));
    } catch (err) {
      alert(`فشل النقل: ${String(err)}`);
    }
  };

  const handleRegisterDevice = async () => {
    try {
      await dispatch(
        registerDevice({
          companyId,
          deviceType: 'desktop',
          deviceFingerprint: `desktop-${companyId}-${Date.now()}`,
        }),
      ).unwrap();
      alert('تم تسجيل الجهاز بنجاح!');
    } catch (err) {
      alert(`فشل التسجيل: ${String(err)}`);
    }
  };

  const handleUpgradeSubscription = async (planId: string) => {
    try {
      await dispatch(upgradeSubscription({ planId, billingCycle: 'monthly' })).unwrap();
      alert(`تمت الترقية إلى ${planId}!`);
    } catch (err) {
      alert(`فشلت الترقية: ${String(err)}`);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={pageContainerStyle}>
      {/* Dashboard summary cards */}
      <div style={dashboardSummaryGrid}>
        <div style={summaryCard}>
          <div style={cardLabel}>صحة قاعدة البيانات</div>
          <div style={{ ...cardValue, color: system.health?.dbConnected ? '#10b981' : '#f59e0b' }}>
            {system.health?.dbConnected ? 'متصل وآمن ✓' : 'مفصول'}
          </div>
          <span style={cardMeta}>مشفر: {system.health?.encryptionActive ? 'نعم' : 'لا'}</span>
        </div>

        <div style={summaryCard}>
          <div style={cardLabel}>حالة الاشتراك</div>
          <div style={cardValue}>
            {system.subscription?.status === 'trialing'
              ? 'تجريبي مجاني'
              : system.subscription?.status === 'active'
                ? 'نشط'
                : system.subscription?.status === 'suspended'
                  ? 'مجمد'
                  : (system.subscription?.status ?? 'غير معروف')}
          </div>
          <span style={cardMeta}>
            الباقة: {system.subscription?.planId ?? 'تجريبية'} | حتى:{' '}
            {system.subscription?.trialEndsAt
              ? new Date(system.subscription.trialEndsAt).toLocaleDateString('ar-EG')
              : '—'}
          </span>
        </div>

        <div style={summaryCard}>
          <div style={cardLabel}>الجهاز</div>
          <div style={cardValue}>{system.registeredDevice ? 'مسجل ✓' : 'غير مسجل'}</div>
          <span style={cardMeta}>
            {system.registeredDevice?.deviceFingerprint ?? 'لا توجد بصمة'}
          </span>
        </div>

        <div style={summaryCard}>
          <div style={cardLabel}>الملف الشخصي</div>
          <div style={cardValue}>{auth.user?.name ?? auth.user?.email ?? 'مستخدم'}</div>
          <span style={cardMeta}>الشركة: {companyId}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={tabBar}>
        {(['products', 'categories', 'units', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            style={activeSubTab === tab ? activeTabStyle : tabStyle}
          >
            {tab === 'products'
              ? 'إدارة المنتجات'
              : tab === 'categories'
                ? 'الفئات'
                : tab === 'units'
                  ? 'وحدات القياس'
                  : 'الاشتراك والترخيص'}
          </button>
        ))}
      </div>

      {/* ── Products Tab ─────────────────────────────────────────────────── */}
      {activeSubTab === 'products' && (
        <div style={layoutStyle}>
          {/* List panel */}
          <div style={listPanelStyle}>
            <div style={panelHeaderStyle}>المنتجات ({products.length})</div>
            <div style={listStyle}>
              {products.length === 0 && (
                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                  لا توجد منتجات مسجلة. أضف منتجاً جديداً أدناه.
                </div>
              )}
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => dispatch(selectProduct(product.id))}
                  style={{
                    ...cardButtonStyle,
                    background: product.id === selectedProductId ? '#eff6ff' : 'transparent',
                    border:
                      product.id === selectedProductId
                        ? '1px solid #bfdbfe'
                        : '1px solid transparent',
                    borderRadius: '10px',
                  }}
                >
                  <ProductCard {...product} />
                </button>
              ))}
            </div>

            {/* Create product form */}
            <form onSubmit={handleCreateProduct} style={formBoxStyle}>
              <div style={formTitle}>إضافة منتج جديد</div>
              <input
                type="text"
                placeholder="اسم المنتج *"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                style={formInput}
                required
              />
              <input
                type="text"
                placeholder="وصف المنتج"
                value={newProductDesc}
                onChange={(e) => setNewProductDesc(e.target.value)}
                style={formInput}
              />
              <select
                value={newProductCat}
                onChange={(e) => setNewProductCat(e.target.value)}
                style={formInput}
              >
                <option value="">بدون فئة</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.ar}
                  </option>
                ))}
              </select>
              <button type="submit" style={primaryButtonStyle}>
                حفظ وإرسال
              </button>
            </form>
          </div>

          {/* Detail panel */}
          <div style={detailPanelStyle}>
            {detailStatus === 'loading' && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                جاري تحميل التفاصيل...
              </div>
            )}

            {selectedProductDetail && detailStatus !== 'loading' ? (
              <>
                {/* Header */}
                <div style={detailHeaderStyle}>
                  <div>
                    <div style={detailTitleStyle}>{selectedProductDetail.name}</div>
                    <div style={detailSubtitleStyle}>ID: {selectedProductDetail.id}</div>
                  </div>
                  <span style={detailStatusStyle(selectedProductDetail.status)}>
                    {selectedProductDetail.status}
                  </span>
                </div>

                {/* Edit form */}
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>تعديل بيانات المنتج</div>
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={formInput}
                        placeholder="اسم المنتج"
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        style={formInput}
                        placeholder="الوصف"
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={handleSaveEdit} style={primaryButtonStyle}>
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          style={secondaryButtonStyle}
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      style={secondaryButtonStyle}
                    >
                      تعديل الاسم والوصف
                    </button>
                  )}
                </div>

                {/* Description */}
                {selectedProductDetail.description && (
                  <div style={sectionStyle}>
                    <div style={sectionLabelStyle}>الوصف</div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {selectedProductDetail.description}
                    </p>
                  </div>
                )}

                {/* Variants */}
                <div style={sectionStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={sectionLabelStyle}>المتغيرات (Variants)</div>
                    <button
                      type="button"
                      onClick={() => setShowVariantForm((v) => !v)}
                      style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      {showVariantForm ? 'إغلاق' : '+ إضافة متغير'}
                    </button>
                  </div>
                  {showVariantForm && (
                    <form
                      onSubmit={handleAddVariant}
                      style={{ display: 'flex', gap: '8px', marginTop: '8px' }}
                    >
                      <input
                        type="text"
                        placeholder="اسم المتغير (مثال: XL)"
                        value={newVariantLabel}
                        onChange={(e) => setNewVariantLabel(e.target.value)}
                        style={{ ...formInput, flex: 1 }}
                        required
                      />
                      <button type="submit" style={primaryButtonStyle}>
                        إضافة
                      </button>
                    </form>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '8px' }}>
                    {selectedProductDetail.variants.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>لا توجد متغيرات</span>
                    ) : (
                      selectedProductDetail.variants.map((v) => (
                        <VariantBadge key={v.id} label={v.label} />
                      ))
                    )}
                  </div>
                </div>

                {/* Units */}
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>وحدات القياس</div>
                  <UnitSelector
                    units={
                      units.length > 0
                        ? units.map((u) => ({
                            id: u.id,
                            label: `${u.unitName}`,
                            conversionLabel: `x${u.conversionFactorToBase} base`,
                          }))
                        : [{ id: 'pcs', label: 'Pieces (قطعة)', conversionLabel: '1 base unit' }]
                    }
                    selectedUnit={selectedUnit}
                    onSelect={setSelectedUnit}
                  />
                </div>

                {/* Stock */}
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>المخزون الحالي</div>
                  {selectedProductDetail.stock ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3,1fr)',
                        gap: '8px',
                        marginTop: '4px',
                      }}
                    >
                      <div style={stockCard('#dcfce7', '#166534')}>
                        <div style={{ fontSize: '0.75rem' }}>وارد</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {selectedProductDetail.stock.totalIn}
                        </div>
                      </div>
                      <div style={stockCard('#fee2e2', '#991b1b')}>
                        <div style={{ fontSize: '0.75rem' }}>صادر</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {selectedProductDetail.stock.totalOut}
                        </div>
                      </div>
                      <div style={stockCard('#eff6ff', '#1d4ed8')}>
                        <div style={{ fontSize: '0.75rem' }}>الرصيد</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {selectedProductDetail.stock.balance}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      لا توجد حركات مخزون مسجلة
                    </span>
                  )}
                </div>

                {/* Barcode */}
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>الباركود</div>
                  <BarcodeDisplay
                    value={selectedProductDetail.barcode ?? selectedProductDetail.id}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => dispatch(generateBarcode(selectedProductDetail.id))}
                      style={secondaryButtonStyle}
                    >
                      توليد باركود
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(archiveProduct(selectedProductDetail.id))}
                      style={archiveBtnStyle}
                    >
                      أرشفة المنتج
                    </button>
                  </div>
                </div>
              </>
            ) : !detailStatus || detailStatus === 'idle' ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                اختر منتجاً من القائمة لعرض تفاصيله.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Categories Tab ────────────────────────────────────────────────── */}
      {activeSubTab === 'categories' && (
        <div style={tabGrid}>
          <div>
            <div style={panelHeaderStyle}>شجرة الفئات ({categories.length})</div>
            <div
              style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {categories.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>لا توجد فئات.</div>
              ) : (
                categories.map((c) => (
                  <div key={c.id} style={categoryRowStyle}>
                    <strong>{c.name.ar}</strong>
                    {c.name.en ? ` (${c.name.en})` : ''}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        background: '#e2e8f0',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      مستوى {c.level}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <form onSubmit={handleCreateCategory} style={formBoxStyle}>
              <div style={formTitle}>إنشاء فئة جديدة</div>
              <input
                type="text"
                placeholder="الاسم بالعربية *"
                value={newCatAr}
                onChange={(e) => setNewCatAr(e.target.value)}
                style={formInput}
                required
              />
              <input
                type="text"
                placeholder="الاسم بالإنجليزية"
                value={newCatEn}
                onChange={(e) => setNewCatEn(e.target.value)}
                style={formInput}
              />
              <button type="submit" style={primaryButtonStyle}>
                إضافة فئة
              </button>
            </form>

            <form onSubmit={handleMoveCategory} style={formBoxStyle}>
              <div style={formTitle}>نقل الفئة</div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                الفئة المراد نقلها:
                <select
                  value={moveCatId}
                  onChange={(e) => setMoveCatId(e.target.value)}
                  style={formInput}
                  required
                >
                  <option value="">-- اختر --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.ar}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                الفئة الأب الجديدة:
                <select
                  value={moveParentId}
                  onChange={(e) => setMoveParentId(e.target.value)}
                  style={formInput}
                >
                  <option value="">المستوى الأول</option>
                  {categories
                    .filter((c) => c.id !== moveCatId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.ar}
                      </option>
                    ))}
                </select>
              </label>
              <button type="submit" style={primaryButtonStyle}>
                تغيير الموضع
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Units Tab ─────────────────────────────────────────────────────── */}
      {activeSubTab === 'units' && (
        <div style={singleViewStyle}>
          <div style={panelHeaderStyle}>وحدات القياس ({units.length})</div>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>المعرف</th>
                <th style={thStyle}>الاسم / الاختصار</th>
                <th style={thStyle}>وحدة أساسية؟</th>
                <th style={thStyle}>معامل التحويل</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}
                  >
                    لا توجد وحدات مسجلة.
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>{u.id}</td>
                    <td style={tdStyle}>{u.unitName}</td>
                    <td style={tdStyle}>{u.isBaseUnit ? 'نعم ✓' : 'لا'}</td>
                    <td style={tdStyle}>{u.conversionFactorToBase}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── System Tab ────────────────────────────────────────────────────── */}
      {activeSubTab === 'system' && (
        <div style={tabGrid}>
          <div>
            <div style={panelHeaderStyle}>خطط الاشتراك</div>
            <p style={{ margin: '10px 0 20px', color: '#64748b', fontSize: '0.9rem' }}>
              الباقة الحالية: <strong>{system.subscription?.planId ?? 'تجريبية'}</strong>
            </p>
            <div style={priceGrid}>
              {[
                {
                  id: 'basic',
                  label: 'Basic',
                  price: '600 EGP/m',
                  features: ['1 نقطة بيع', 'نسخ احتياطي'],
                },
                {
                  id: 'pro',
                  label: 'Pro',
                  price: '1,200 EGP/m',
                  features: ['نقاط غير محدودة', 'مزامنة سحابية'],
                  highlight: true,
                },
                {
                  id: 'enterprise',
                  label: 'Enterprise',
                  price: 'اتصل بنا',
                  features: ['متعدد الفروع', 'ذكاء اصطناعي'],
                },
              ].map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    ...priceCard,
                    ...(plan.highlight
                      ? { border: '2px solid #3b82f6', background: '#eff6ff' }
                      : {}),
                  }}
                >
                  {plan.highlight && <span style={activePriceLabel}>الأكثر طلباً</span>}
                  <h4 style={{ margin: 0 }}>{plan.label}</h4>
                  <div style={priceText}>{plan.price}</div>
                  <ul style={priceFeatures}>
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleUpgradeSubscription(plan.id)}
                    style={{
                      ...priceBtn,
                      ...(plan.highlight
                        ? { background: '#3b82f6', color: '#fff', border: 'none' }
                        : {}),
                    }}
                    disabled={system.subscription?.planId === plan.id}
                  >
                    {system.subscription?.planId === plan.id ? 'الباقة الحالية ✓' : 'ترقية الآن'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={panelHeaderStyle}>تسجيل الجهاز</div>
            <div
              style={{
                background: '#f8fafc',
                padding: '20px',
                borderRadius: '12px',
                marginTop: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#475569',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                }}
              >
                ربط هذا الجهاز برخصة متجرك يمكّن التشغيل دون اتصال وحماية البيانات.
              </p>
              <button
                type="button"
                onClick={handleRegisterDevice}
                style={{
                  ...primaryButtonStyle,
                  width: '100%',
                  background: system.registeredDevice ? '#10b981' : '#0f172a',
                }}
              >
                {system.registeredDevice ? 'جهازك مسجل — إعادة ربط' : 'تسجيل هذا الجهاز'}
              </button>
              {system.registeredDevice && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                  معرف التسجيل: <strong>{system.registeredDevice.id}</strong>
                </div>
              )}
            </div>

            <div
              style={{
                ...formBoxStyle,
                marginTop: '20px',
                backgroundColor: '#fef2f2',
                borderColor: '#fee2e2',
              }}
            >
              <div style={{ color: '#991b1b', fontWeight: 600 }}>معلومات الصلاحيات</div>
              <div style={{ fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.5 }}>
                الأدوار:{' '}
                {auth.branchRoles.length > 0
                  ? auth.branchRoles.join(', ')
                  : 'أدوار افتراضية (موظف نقطة بيع)'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageContainerStyle: React.CSSProperties = {
  padding: '24px',
  background: '#f8fafc',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  fontFamily: 'Inter, Tahoma, sans-serif',
};

const dashboardSummaryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
};

const summaryCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '18px 20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const cardLabel: React.CSSProperties = { fontSize: '0.85rem', color: '#64748b', fontWeight: 600 };
const cardValue: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' };
const cardMeta: React.CSSProperties = { fontSize: '0.75rem', color: '#94a3b8' };

const tabBar: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #e2e8f0',
  gap: '4px',
  flexWrap: 'wrap',
};
const tabStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '12px 18px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#64748b',
  borderBottom: '2px solid transparent',
};
const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: '#0f172a',
  borderBottom: '2px solid #0f172a',
};

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 1fr) minmax(280px, 1fr)',
  gap: '24px',
  alignItems: 'start',
};

const listPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const panelHeaderStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#1e293b',
  borderBottom: '2px solid #f1f5f9',
  paddingBottom: '8px',
};

const cardButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '6px 8px',
  width: '100%',
  cursor: 'pointer',
  textAlign: 'right',
  transition: 'background 0.15s',
};

const detailPanelStyle: React.CSSProperties = {
  borderRadius: '20px',
  background: '#fff',
  padding: '24px',
  boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  border: '1px solid #f1f5f9',
};

const detailHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '12px',
};
const detailTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#0f172a',
};
const detailSubtitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#94a3b8',
  marginTop: '2px',
};
const detailStatusStyle = (status: string): React.CSSProperties => ({
  backgroundColor: status === 'active' ? '#dcfce7' : status === 'archived' ? '#fef2f2' : '#f3e8ff',
  color: status === 'active' ? '#166534' : status === 'archived' ? '#991b1b' : '#6b21a8',
  fontSize: '0.75rem',
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: '999px',
});

const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const sectionLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '0.8rem',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const stockCard = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  padding: '12px',
  borderRadius: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
});

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};
const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  padding: '10px 16px',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};
const archiveBtnStyle: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const formBoxStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};
const formTitle: React.CSSProperties = { fontWeight: 700, fontSize: '0.95rem', color: '#334155' };
const formInput: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box',
};

const tabGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '30px',
};

const categoryRowStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  padding: '12px 14px',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const singleViewStyle: React.CSSProperties = {
  background: '#fff',
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'right',
  marginTop: '16px',
};
const thStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '2px solid #e2e8f0',
  fontWeight: 700,
  color: '#475569',
  fontSize: '0.85rem',
};
const tdStyle: React.CSSProperties = { padding: '12px', color: '#334155', fontSize: '0.9rem' };

const priceGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px',
  marginTop: '20px',
};
const priceCard: React.CSSProperties = {
  position: 'relative',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
};
const priceText: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' };
const priceFeatures: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  fontSize: '0.82rem',
  color: '#64748b',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};
const priceBtn: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.85rem',
};
const activePriceLabel: React.CSSProperties = {
  position: 'absolute',
  top: '-12px',
  background: '#3b82f6',
  color: '#fff',
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '999px',
};
