import React, { useEffect, useMemo, useState } from 'react';
import { BarcodeDisplay, UnitSelector, VariantBadge } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchProducts,
  fetchProductById,
  fetchProductVariants,
  fetchProductStock,
  fetchCategories,
  fetchUnits,
  selectProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  generateBarcode,
  addVariant,
  clearProductDetail,
} from '../../lib/store/catalogSlice';

const tabs = [
  'General Info',
  'Variants',
  'Units & Conversion',
  'Batches/Expiry',
  'Pricing History',
  'Stock by Warehouse',
] as const;

type TabKey = (typeof tabs)[number];

type StatusFilter = 'all' | 'active' | 'archived' | 'draft';

export function ProductListPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { products, selectedProductId, selectedProductDetail, detailStatus, categories, units, status } =
    useAppSelector((state) => state.catalog);
  const companyId = useAppSelector((state) => state.auth.user?.companyId ?? 'company-1');

  const [activeTab, setActiveTab] = useState<TabKey>('General Info');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  // Initial load
  useEffect(() => {
    void dispatch(fetchProducts({ companyId }));
    void dispatch(fetchCategories({ companyId }));
    void dispatch(fetchUnits({ companyId }));
  }, [dispatch, companyId]);

  // Load detail when selection changes
  useEffect(() => {
    if (selectedProductId) {
      void dispatch(fetchProductById(selectedProductId));
      void dispatch(fetchProductVariants(selectedProductId));
      void dispatch(fetchProductStock(selectedProductId));
    } else {
      dispatch(clearProductDetail());
    }
  }, [dispatch, selectedProductId]);

  // Sync edit form with selected product detail
  useEffect(() => {
    if (selectedProductDetail && formMode === 'edit') {
      setEditName(selectedProductDetail.name);
      setEditDesc(selectedProductDetail.description ?? '');
    }
  }, [selectedProductDetail, formMode]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = `${p.name} ${p.sku}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const selectedProduct = filteredProducts.find((p) => p.id === selectedProductId);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get('name') as string).trim();
    const description = (data.get('description') as string).trim();
    const categoryId = (data.get('categoryId') as string) || undefined;
    if (!name) return;
    setActionError(null);
    try {
      await dispatch(createProduct({ name, description, categoryId, companyId })).unwrap();
      form.reset();
      setIsFormOpen(false);
    } catch (err) {
      setActionError(String(err));
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setActionError(null);
    try {
      await dispatch(
        updateProduct({ id: selectedProductId, name: editName, description: editDesc }),
      ).unwrap();
      setFormMode('create');
      setIsFormOpen(false);
    } catch (err) {
      setActionError(String(err));
    }
  };

  const handleAddVariant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductId || !newVariantLabel.trim()) return;
    setActionError(null);
    try {
      await dispatch(
        addVariant({ productId: selectedProductId, label: newVariantLabel }),
      ).unwrap();
      setNewVariantLabel('');
      setShowVariantForm(false);
    } catch (err) {
      setActionError(String(err));
    }
  };

  const handleGenerateBarcode = async () => {
    if (!selectedProductId) return;
    setActionError(null);
    try {
      await dispatch(generateBarcode(selectedProductId)).unwrap();
    } catch (err) {
      setActionError(String(err));
    }
  };

  const handleArchive = async () => {
    if (!selectedProductId) return;
    setActionError(null);
    try {
      await dispatch(archiveProduct(selectedProductId)).unwrap();
    } catch (err) {
      setActionError(String(err));
    }
  };

  const resolvedUnit = (selectedUnit || units[0]?.id) ?? '';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage catalog items and stock details.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFormMode('create');
            setIsFormOpen(true);
          }}
        >
          Add Product
        </button>
      </div>

      {actionError && <div className="error-banner">{actionError}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or SKU"
          aria-label="Search products"
        />
        <select
          className="form-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Create form */}
      {isFormOpen && formMode === 'create' && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Add Product
          </h2>
          <form
            onSubmit={handleCreateProduct}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          >
            <div className="form-field">
              <label className="form-label" htmlFor="prod-name">
                Name *
              </label>
              <input id="prod-name" name="name" className="form-input" required />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="prod-desc">
                Description
              </label>
              <input id="prod-desc" name="description" className="form-input" />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="prod-cat">
                Category
              </label>
              <select id="prod-cat" name="categoryId" className="form-select">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.ar}{c.name.en ? ` (${c.name.en})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main split layout */}
      {status === 'loading' && products.length === 0 ? (
        <div className="loading">Loading products…</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No products found</p>
          <p>Try a different filter or add a new product.</p>
        </div>
      ) : (
        <div className="split-layout">
          {/* Left: product table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th className="table-numeric">Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={selectedProductId === product.id ? 'selected' : ''}
                    onClick={() => dispatch(selectProduct(product.id))}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{product.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{product.sku}</td>
                    <td className="table-numeric">
                      {product.price.toLocaleString('ar-EG')}
                    </td>
                    <td>
                      <span
                        className={
                          product.stockLabel === 'Low stock'
                            ? 'stock-low'
                            : product.stockLabel === 'Out of stock'
                              ? 'stock-critical'
                              : 'stock-healthy'
                        }
                      >
                        {product.stockLabel}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${product.status === 'active' ? 'active' : product.status === 'archived' ? 'archived' : 'draft'}`}
                      >
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({filteredProducts.length} items)
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right: product detail */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {detailStatus === 'loading' && <div className="loading">Loading…</div>}

            {!selectedProduct && detailStatus !== 'loading' && (
              <div className="empty-state">
                <p>Select a product to view details.</p>
              </div>
            )}

            {selectedProductDetail && detailStatus !== 'loading' && (
              <>
                {/* Detail header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
                      {selectedProductDetail.name}
                    </h2>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {selectedProductDetail.sku}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditName(selectedProductDetail.name);
                        setEditDesc(selectedProductDetail.description ?? '');
                        setFormMode('edit');
                        setIsFormOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleArchive}
                    >
                      Archive
                    </button>
                  </div>
                </div>

                {/* Edit form (inline) */}
                {isFormOpen && formMode === 'edit' && (
                  <form
                    onSubmit={handleUpdateProduct}
                    style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                  >
                    <div className="form-field">
                      <label className="form-label" htmlFor="edit-name">Name</label>
                      <input
                        id="edit-name"
                        className="form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label" htmlFor="edit-desc">Description</label>
                      <input
                        id="edit-desc"
                        className="form-input"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button type="submit" className="btn btn-primary btn-sm">Save</button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsFormOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Tabs */}
                <div className="tab-bar">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === 'General Info' && (
                  <div className="section">
                    <span className="section-label">Description</span>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {selectedProductDetail.description || '—'}
                    </p>
                    <span className="section-label">Barcode</span>
                    <BarcodeDisplay value={selectedProductDetail.barcode ?? selectedProductDetail.id} />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleGenerateBarcode}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      Generate Barcode
                    </button>
                  </div>
                )}

                {activeTab === 'Variants' && (
                  <div className="section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="section-label">Variants</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowVariantForm((v) => !v)}
                      >
                        {showVariantForm ? 'Close' : '+ Add Variant'}
                      </button>
                    </div>
                    {showVariantForm && (
                      <form onSubmit={handleAddVariant} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input
                          className="form-input"
                          placeholder="Variant label (e.g. XL)"
                          value={newVariantLabel}
                          onChange={(e) => setNewVariantLabel(e.target.value)}
                          required
                        />
                        <button type="submit" className="btn btn-primary btn-sm">Add</button>
                      </form>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {selectedProductDetail.variants.length === 0 ? (
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                          No variants.
                        </p>
                      ) : (
                        selectedProductDetail.variants.map((v) => (
                          <VariantBadge key={v.id} label={v.label} />
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'Units & Conversion' && (
                  <div className="section">
                    <span className="section-label">Unit of Measure</span>
                    <UnitSelector
                      units={
                        units.length > 0
                          ? units.map((u) => ({
                              id: u.id,
                              label: u.unitName,
                              conversionLabel: `×${u.conversionFactorToBase} base`,
                            }))
                          : []
                      }
                      selectedUnit={resolvedUnit}
                      onSelect={setSelectedUnit}
                    />
                  </div>
                )}

                {activeTab === 'Stock by Warehouse' && (
                  <div className="section">
                    <span className="section-label">Stock Summary</span>
                    {selectedProductDetail.stock ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-3)' }}>
                        <div className="stat-card">
                          <span className="stat-label">In</span>
                          <span className="stat-value stock-healthy">{selectedProductDetail.stock.totalIn}</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-label">Out</span>
                          <span className="stat-value stock-critical">{selectedProductDetail.stock.totalOut}</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-label">Balance</span>
                          <span className="stat-value">{selectedProductDetail.stock.balance}</span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        No stock data available.
                      </p>
                    )}
                  </div>
                )}

                {(activeTab === 'Batches/Expiry' || activeTab === 'Pricing History') && (
                  <div className="section">
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {activeTab === 'Batches/Expiry'
                        ? 'Batch tracking is managed via Inventory module.'
                        : 'Pricing history is available in the Reports module.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
