import React, { useMemo, useState } from 'react';
import { BarcodeDisplay, UnitSelector, VariantBadge } from '@packages/ui-components';

type ProductItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: number;
  stock: number;
  status: 'active' | 'archived' | 'draft';
  barcode: string;
};

const initialProducts: ProductItem[] = [
  {
    id: '1',
    nameAr: 'قهوة عربية',
    nameEn: 'Arabica Coffee',
    sku: 'SKU-1001',
    category: 'Beverages',
    unit: 'pcs',
    sellingPrice: 1490,
    stock: 12,
    status: 'active',
    barcode: 'SKU-1001',
  },
  {
    id: '2',
    nameAr: 'زجاجة مياه',
    nameEn: 'Water Bottle',
    sku: 'SKU-1002',
    category: 'Beverages',
    unit: 'box',
    sellingPrice: 890,
    stock: 2,
    status: 'draft',
    barcode: 'SKU-1002',
  },
  {
    id: '3',
    nameAr: 'شوكولاتة داكنة',
    nameEn: 'Dark Chocolate',
    sku: 'SKU-1003',
    category: 'Snacks',
    unit: 'pack',
    sellingPrice: 620,
    stock: 30,
    status: 'active',
    barcode: 'SKU-1003',
  },
];

const tabs = [
  'General Info',
  'Variants',
  'Units & Conversion',
  'Batches/Expiry',
  'Pricing History',
  'Stock by Warehouse',
] as const;

type TabKey = (typeof tabs)[number];

export function ProductListPage() {
  const [products, setProducts] = useState(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState(initialProducts[0].id);
  const [activeTab, setActiveTab] = useState<TabKey>('General Info');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductItem['status']>('all');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [draftProduct, setDraftProduct] = useState<ProductItem>({
    id: `temp-${Date.now()}`,
    nameAr: '',
    nameEn: '',
    sku: '',
    category: 'Beverages',
    unit: 'pcs',
    sellingPrice: 0,
    stock: 0,
    status: 'active',
    barcode: '',
  });
  const pageSize = 2;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = `${product.nameAr} ${product.nameEn} ${product.sku}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ??
    pagedProducts[0] ??
    products[0];

  const handleSaveProduct = () => {
    const normalized = {
      ...draftProduct,
      sku: draftProduct.sku || `SKU-${products.length + 1}`,
      barcode: draftProduct.barcode || draftProduct.sku || `SKU-${products.length + 1}`,
    };

    if (formMode === 'edit') {
      setProducts((current) =>
        current.map((product) => (product.id === normalized.id ? normalized : product)),
      );
    } else {
      setProducts((current) => [normalized, ...current]);
      setSelectedProductId(normalized.id);
    }

    setIsFormOpen(false);
    setDraftProduct(normalized);
  };

  return (
    <div style={{ padding: 24, display: 'grid', gap: 20 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Products</div>
          <div style={{ color: '#57606a' }}>Manage catalog items and stock details.</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormMode('create');
            setDraftProduct({
              id: `temp-${Date.now()}`,
              nameAr: '',
              nameEn: '',
              sku: '',
              category: 'Beverages',
              unit: 'pcs',
              sellingPrice: 0,
              stock: 0,
              status: 'active',
              barcode: '',
            });
            setIsFormOpen(true);
          }}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '10px 16px',
            background: '#0969da',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Add Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name or SKU"
          style={{
            minWidth: 240,
            border: '1px solid #d0d7de',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as 'all' | ProductItem['status']);
            setPage(1);
          }}
          style={{ border: '1px solid #d0d7de', borderRadius: 10, padding: '10px 12px' }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div
          style={{
            border: '1px dashed #d0d7de',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            background: '#fff',
          }}
        >
          <div style={{ fontWeight: 700 }}>No products found</div>
          <div style={{ color: '#57606a', marginTop: 8 }}>
            Try a different filter or add a new product.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
          <div
            style={{
              border: '1px solid #d0d7de',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f6f8fa' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>SKU</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Category</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Unit</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Price</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Stock</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    style={{
                      cursor: 'pointer',
                      background: selectedProduct.id === product.id ? '#f6f8fa' : '#fff',
                    }}
                  >
                    <td style={{ padding: 12 }}>{product.nameEn}</td>
                    <td style={{ padding: 12 }}>{product.sku}</td>
                    <td style={{ padding: 12 }}>{product.category}</td>
                    <td style={{ padding: 12 }}>{product.unit}</td>
                    <td style={{ padding: 12 }}>{product.sellingPrice.toLocaleString()} ₽</td>
                    <td style={{ padding: 12, color: product.stock < 5 ? '#cf222e' : '#1a7f37' }}>
                      {product.stock}
                    </td>
                    <td style={{ padding: 12 }}>{product.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                borderTop: '1px solid #d0d7de',
              }}
            >
              <div style={{ color: '#57606a' }}>
                Page {currentPage} of {totalPages}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  style={navButtonStyle}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  style={navButtonStyle}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              border: '1px solid #d0d7de',
              borderRadius: 12,
              padding: 16,
              background: '#fff',
              display: 'grid',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedProduct.nameEn}</div>
                <div style={{ color: '#57606a' }}>{selectedProduct.sku}</div>
              </div>
              <button
                type="button"
                style={{
                  border: '1px solid #d0d7de',
                  borderRadius: 999,
                  padding: '8px 12px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Print
              </button>
            </div>

            <BarcodeDisplay value={selectedProduct.barcode} />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    borderRadius: 999,
                    border: activeTab === tab ? '1px solid #0969da' : '1px solid #d0d7de',
                    background: activeTab === tab ? '#eaf4ff' : '#fff',
                    color: activeTab === tab ? '#0969da' : '#24292f',
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {isFormOpen ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontWeight: 700 }}>
                  {formMode === 'edit' ? 'Edit product' : 'Add product'}
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Arabic Name</span>
                  <input
                    value={draftProduct.nameAr}
                    onChange={(event) =>
                      setDraftProduct((current) => ({ ...current, nameAr: event.target.value }))
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>English Name</span>
                  <input
                    value={draftProduct.nameEn}
                    onChange={(event) =>
                      setDraftProduct((current) => ({ ...current, nameEn: event.target.value }))
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Category</span>
                  <input
                    value={draftProduct.category}
                    onChange={(event) =>
                      setDraftProduct((current) => ({ ...current, category: event.target.value }))
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Selling Price</span>
                  <input
                    type="number"
                    value={draftProduct.sellingPrice}
                    onChange={(event) =>
                      setDraftProduct((current) => ({
                        ...current,
                        sellingPrice: Number(event.target.value),
                      }))
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Barcode</span>
                  <input
                    value={draftProduct.barcode}
                    onChange={(event) =>
                      setDraftProduct((current) => ({ ...current, barcode: event.target.value }))
                    }
                    style={inputStyle}
                  />
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleSaveProduct}
                    style={{
                      border: 'none',
                      borderRadius: 999,
                      padding: '8px 12px',
                      background: '#0969da',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    style={{
                      border: '1px solid #d0d7de',
                      borderRadius: 999,
                      padding: '8px 12px',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {activeTab === 'General Info' && !isFormOpen ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Arabic Name</span>
                  <input defaultValue={selectedProduct.nameAr} style={inputStyle} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>English Name</span>
                  <input defaultValue={selectedProduct.nameEn} style={inputStyle} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Category</span>
                  <input defaultValue={selectedProduct.category} style={inputStyle} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Selling Price</span>
                  <input defaultValue={selectedProduct.sellingPrice} style={inputStyle} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Barcode</span>
                  <input defaultValue={selectedProduct.barcode} style={inputStyle} />
                </label>
              </div>
            ) : null}

            {activeTab === 'Variants' ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <VariantBadge label="Classic" selected />
                  <VariantBadge label="Premium" attributes={['Large', 'Gift'] as string[]} />
                </div>
                <div style={{ border: '1px dashed #d0d7de', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Add variant</div>
                  <input placeholder="Variant name" style={inputStyle} />
                </div>
              </div>
            ) : null}

            {activeTab === 'Units & Conversion' ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontWeight: 600 }}>Base unit</div>
                <div>{selectedProduct.unit}</div>
                <UnitSelector
                  units={[
                    { id: 'pcs', label: 'Pieces', conversionLabel: '1 base unit' },
                    { id: 'box', label: 'Box', conversionLabel: '12 pcs' },
                    { id: 'pack', label: 'Pack', conversionLabel: '24 pcs' },
                  ]}
                  selectedUnit={selectedProduct.unit}
                  onSelect={() => undefined}
                />
              </div>
            ) : null}

            {activeTab === 'Batches/Expiry' ? (
              <div style={{ color: '#57606a' }}>
                Batch tracking and expiry date controls will appear here.
              </div>
            ) : null}

            {activeTab === 'Pricing History' ? (
              <div style={{ color: '#57606a' }}>Pricing history timeline placeholder.</div>
            ) : null}

            {activeTab === 'Stock by Warehouse' ? (
              <div style={{ color: '#57606a' }}>Warehouse stock levels placeholder.</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 10,
  padding: '10px 12px',
};

const navButtonStyle: React.CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 8,
  background: '#fff',
  padding: '6px 10px',
  cursor: 'pointer',
};
