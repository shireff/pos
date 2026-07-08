import React, { useMemo, useState } from 'react';
import { ProductCard, VariantBadge, UnitSelector, BarcodeDisplay } from '@packages/ui-components';

type ProductItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  price: number;
  stockLabel: string;
  status: 'active' | 'draft' | 'archived';
  barcode: string;
};

const products: ProductItem[] = [
  {
    id: '1',
    nameAr: 'قهوة عربية',
    nameEn: 'Arabica Coffee',
    sku: 'SKU-1001',
    price: 1490,
    stockLabel: '12 units',
    status: 'active',
    barcode: 'SKU-1001',
  },
  {
    id: '2',
    nameAr: 'زجاجة مياه',
    nameEn: 'Water Bottle',
    sku: 'SKU-1002',
    price: 890,
    stockLabel: 'Low stock',
    status: 'draft',
    barcode: 'SKU-1002',
  },
];

export function ProductListPage() {
  const [search, setSearch] = useState('');
  const [productList, setProductList] = useState<ProductItem[]>(products);
  const [selectedUnit, setSelectedUnit] = useState('pcs');
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draftProduct, setDraftProduct] = useState(products[0]);

  const filteredProducts = useMemo(() => {
    return productList.filter((product) => {
      return `${product.nameAr} ${product.nameEn} ${product.sku}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [productList, search]);

  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ??
    filteredProducts[0] ??
    productList[0];

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Products</div>
        <button
          type="button"
          onClick={() => {
            setDraftProduct({
              id: `temp-${Date.now()}`,
              nameAr: '',
              nameEn: '',
              sku: '',
              price: 0,
              stockLabel: '0 units',
              status: 'active',
              barcode: '',
            });
            setIsFormOpen(true);
          }}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '8px 12px',
            background: '#0969da',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search product"
        style={{ border: '1px solid #d0d7de', borderRadius: 10, padding: '10px 12px' }}
      />

      {filteredProducts.length === 0 ? (
        <div
          style={{
            border: '1px dashed #d0d7de',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            background: '#fff',
          }}
        >
          No products found.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelectedProductId(product.id)}
              style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left' }}
            >
              <ProductCard {...product} name={`${product.nameAr} / ${product.nameEn}`} />
            </button>
          ))}
        </div>
      )}

      {isFormOpen ? (
        <div
          style={{
            border: '1px solid #d0d7de',
            borderRadius: 12,
            padding: 16,
            background: '#fff',
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 700 }}>Add product</div>
          <input
            value={draftProduct.nameAr}
            onChange={(event) =>
              setDraftProduct((current) => ({ ...current, nameAr: event.target.value }))
            }
            placeholder="Arabic name"
            style={{ border: '1px solid #d0d7de', borderRadius: 10, padding: '10px 12px' }}
          />
          <input
            value={draftProduct.nameEn}
            onChange={(event) =>
              setDraftProduct((current) => ({ ...current, nameEn: event.target.value }))
            }
            placeholder="English name"
            style={{ border: '1px solid #d0d7de', borderRadius: 10, padding: '10px 12px' }}
          />
          <input
            value={draftProduct.sku}
            onChange={(event) =>
              setDraftProduct((current) => ({ ...current, sku: event.target.value }))
            }
            placeholder="SKU"
            style={{ border: '1px solid #d0d7de', borderRadius: 10, padding: '10px 12px' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const normalized = {
                  ...draftProduct,
                  sku: draftProduct.sku || `SKU-${productList.length + 1}`,
                  barcode:
                    draftProduct.barcode || draftProduct.sku || `SKU-${productList.length + 1}`,
                };
                setProductList((current) => [normalized, ...current]);
                setSelectedProductId(normalized.id);
                setIsFormOpen(false);
              }}
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

      <div
        style={{
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16,
          background: '#fff',
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 700 }}>{selectedProduct.nameEn}</div>
        <div style={{ color: '#57606a' }}>{selectedProduct.sku}</div>
        <VariantBadge label="Classic" selected />
        <UnitSelector
          units={[
            { id: 'pcs', label: 'Pieces', conversionLabel: '1 base unit' },
            { id: 'box', label: 'Box', conversionLabel: '12 pcs' },
            { id: 'pack', label: 'Pack', conversionLabel: '24 pcs' },
          ]}
          selectedUnit={selectedUnit}
          onSelect={setSelectedUnit}
        />
        <BarcodeDisplay value={selectedProduct.barcode} />
      </div>
    </div>
  );
}
