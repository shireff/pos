import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { client } from '../api/client';
import { ApiEndpoints, buildEndpoint } from '../api/endpoints';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockLabel: string;
  status: 'active' | 'draft' | 'archived' | string;
  barcode?: string;
  description?: string;
  categoryId?: string | null;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  stock: StockInfo | null;
}

export interface ProductVariant {
  id: string;
  label: string;
  barcode?: string;
  price?: number;
}

export interface StockInfo {
  totalIn: number;
  totalOut: number;
  balance: number;
  movements: { type: string; qty: number; note: string; at: string }[];
}

export interface Category {
  id: string;
  companyId: string;
  parentId: string | null;
  name: { ar: string; en?: string };
  sortOrder: number;
  level: number;
  path: string;
  children?: Category[];
}

export interface UnitOfMeasure {
  id: string;
  productId: string;
  unitName: string;
  isBaseUnit: boolean;
  conversionFactorToBase: number;
}

export interface CatalogState {
  products: Product[];
  selectedProductId: string;
  selectedProductDetail: ProductDetail | null;
  categories: Category[];
  selectedCategory: Category | null;
  units: UnitOfMeasure[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CatalogState = {
  products: [],
  selectedProductId: '',
  selectedProductDetail: null,
  categories: [],
  selectedCategory: null,
  units: [],
  status: 'idle',
  detailStatus: 'idle',
  error: null,
};

// ─── Products ────────────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk<
  Product[],
  { companyId?: string; status?: string } | void,
  { rejectValue: string }
>('catalog/fetchProducts', async (params, thunkAPI) => {
  try {
    const companyId = params?.companyId ?? 'company-1';
    const status = params?.status ?? 'all';
    const response = await client.get(
      `${ApiEndpoints.Products}?companyId=${companyId}&status=${status}`,
    );
    const items = response.data.data?.items ?? [];
    return items.map((item: any) => ({
      id: item.id,
      name: item.name,
      sku: item.sku ?? item.id,
      price: item.price ?? 0,
      stockLabel: 'In stock',
      status: item.isDeleted ? 'archived' : 'active',
      description: item.description,
      categoryId: item.categoryId,
      barcode: item.barcode,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch products');
  }
});

export const fetchProductById = createAsyncThunk<ProductDetail, string, { rejectValue: string }>(
  'catalog/fetchProductById',
  async (productId, thunkAPI) => {
    try {
      const endpoint = buildEndpoint(ApiEndpoints.ProductById, { id: productId });
      const [detailRes, stockRes, variantsRes] = await Promise.allSettled([
        client.get(endpoint),
        client.get(buildEndpoint(ApiEndpoints.ProductStock, { id: productId })),
        client.get(buildEndpoint(ApiEndpoints.ProductVariants, { id: productId })),
      ]);

      const item = detailRes.status === 'fulfilled' ? detailRes.value.data.data : null;
      const stockData = stockRes.status === 'fulfilled' ? stockRes.value.data.data : null;
      const variantsData =
        variantsRes.status === 'fulfilled' ? (variantsRes.value.data.data ?? []) : [];

      return {
        id: item?.id ?? productId,
        name: item?.name ?? '',
        sku: item?.sku ?? productId,
        price: item?.price ?? 0,
        stockLabel: stockData ? `${stockData.balance ?? 0} وحدة` : 'غير متاح',
        status: item?.isDeleted ? 'archived' : 'active',
        description: item?.description ?? '',
        categoryId: item?.categoryId ?? null,
        barcode: item?.barcode,
        variants: variantsData.map((v: any) => ({
          id: v.id,
          label: v.label ?? v.name ?? v.id,
          barcode: v.barcode,
          price: v.price,
        })),
        stock: stockData
          ? {
              totalIn: stockData.totalIn ?? 0,
              totalOut: stockData.totalOut ?? 0,
              balance: stockData.balance ?? 0,
              movements: stockData.movements ?? [],
            }
          : null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          (error.response as any)?.data?.error?.message || error.message,
        );
      }
      return thunkAPI.rejectWithValue('Failed to fetch product detail');
    }
  },
);

export const updateProduct = createAsyncThunk<
  Product,
  { id: string; name?: string; description?: string; categoryId?: string | null },
  { rejectValue: string }
>('catalog/updateProduct', async ({ id, ...updates }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.ProductById, { id });
    const response = await client.patch(endpoint, updates);
    const item = response.data.data;
    return {
      id: item.id,
      name: item.name,
      sku: item.sku ?? item.id,
      price: item.price ?? 0,
      stockLabel: 'In stock',
      status: item.isDeleted ? 'archived' : 'active',
      description: item.description,
      categoryId: item.categoryId,
      barcode: item.barcode,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to update product');
  }
});

export const createProduct = createAsyncThunk<
  Product,
  { name: string; description: string; categoryId?: string; companyId?: string },
  { rejectValue: string }
>('catalog/createProduct', async (payload, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.Products, {
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId ?? null,
      companyId: payload.companyId ?? 'company-1',
    });
    const item = response.data.data;
    return {
      id: item.id,
      name: item.name,
      sku: item.sku ?? item.id,
      price: 0,
      stockLabel: '0 وحدة',
      status: 'active',
      description: item.description,
      categoryId: item.categoryId,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to create product');
  }
});

export const fetchProductStock = createAsyncThunk<
  { productId: string; stock: StockInfo },
  string,
  { rejectValue: string }
>('catalog/fetchProductStock', async (productId, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.ProductStock, { id: productId });
    const response = await client.get(endpoint);
    return { productId, stock: response.data.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch stock information');
  }
});

export const fetchProductVariants = createAsyncThunk<
  { productId: string; variants: ProductVariant[] },
  string,
  { rejectValue: string }
>('catalog/fetchProductVariants', async (productId, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.ProductVariants, { id: productId });
    const response = await client.get(endpoint);
    return { productId, variants: response.data.data ?? [] };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch product variants');
  }
});

export const addVariant = createAsyncThunk<
  { productId: string; variant: ProductVariant },
  { productId: string; label: string; barcode?: string; price?: number },
  { rejectValue: string }
>('catalog/addVariant', async ({ productId, ...variantData }, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.ProductVariants, { id: productId });
    const response = await client.post(endpoint, variantData);
    const v = response.data.data;
    return {
      productId,
      variant: { id: v.id, label: v.label ?? v.name ?? v.id, barcode: v.barcode, price: v.price },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to add product variant');
  }
});

export const generateBarcode = createAsyncThunk<
  { productId: string; barcode: string },
  string,
  { rejectValue: string }
>('catalog/generateBarcode', async (productId, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.ProductBarcode, { id: productId });
    const response = await client.post(endpoint);
    return { productId, barcode: response.data.data.barcode };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to generate product barcode');
  }
});

export const archiveProduct = createAsyncThunk<string, string, { rejectValue: string }>(
  'catalog/archiveProduct',
  async (productId, thunkAPI) => {
    try {
      const endpoint = buildEndpoint(ApiEndpoints.ProductArchive, { id: productId });
      await client.post(endpoint);
      return productId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          (error.response as any)?.data?.error?.message || error.message,
        );
      }
      return thunkAPI.rejectWithValue('Failed to archive product');
    }
  },
);

// ─── Categories ───────────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk<
  Category[],
  { companyId?: string; flat?: boolean } | void,
  { rejectValue: string }
>('catalog/fetchCategories', async (params, thunkAPI) => {
  try {
    const companyId = params?.companyId ?? 'company-1';
    const flat = params?.flat !== false;
    const response = await client.get(
      `${ApiEndpoints.Categories}?companyId=${companyId}&flat=${flat}`,
    );
    return response.data.data ?? [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch categories');
  }
});

export const fetchCategoryById = createAsyncThunk<Category, string, { rejectValue: string }>(
  'catalog/fetchCategoryById',
  async (categoryId, thunkAPI) => {
    try {
      const endpoint = buildEndpoint(ApiEndpoints.CategoryById, { id: categoryId });
      const response = await client.get(endpoint);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          (error.response as any)?.data?.error?.message || error.message,
        );
      }
      return thunkAPI.rejectWithValue('Failed to fetch category');
    }
  },
);

export const createCategory = createAsyncThunk<
  Category,
  { name: { ar: string; en?: string }; parentId?: string | null; companyId?: string },
  { rejectValue: string }
>('catalog/createCategory', async (payload, thunkAPI) => {
  try {
    const response = await client.post(ApiEndpoints.Categories, {
      name: payload.name,
      parentId: payload.parentId ?? null,
      companyId: payload.companyId ?? 'company-1',
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to create category');
  }
});

export const moveCategory = createAsyncThunk<
  Category,
  { categoryId: string; newParentId: string | null },
  { rejectValue: string }
>('catalog/moveCategory', async (payload, thunkAPI) => {
  try {
    const endpoint = buildEndpoint(ApiEndpoints.CategoryMove, { id: payload.categoryId });
    const response = await client.post(endpoint, { newParentId: payload.newParentId });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to move category');
  }
});

// ─── Units ────────────────────────────────────────────────────────────────────

export const fetchUnits = createAsyncThunk<
  UnitOfMeasure[],
  { companyId?: string } | void,
  { rejectValue: string }
>('catalog/fetchUnits', async (params, thunkAPI) => {
  try {
    const companyId = params?.companyId ?? 'company-1';
    const response = await client.get(`${ApiEndpoints.Units}?companyId=${companyId}`);
    return response.data.data ?? [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        (error.response as any)?.data?.error?.message || error.message,
      );
    }
    return thunkAPI.rejectWithValue('Failed to fetch units of measure');
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<string>) {
      state.selectedProductId = action.payload;
      // Clear previous detail so new load is triggered
      if (state.selectedProductDetail?.id !== action.payload) {
        state.selectedProductDetail = null;
      }
    },
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
      if (!state.products.find((p) => p.id === state.selectedProductId)) {
        state.selectedProductId = state.products[0]?.id ?? '';
      }
    },
    clearProductDetail(state) {
      state.selectedProductDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
        if (
          state.products.length > 0 &&
          !state.products.find((p) => p.id === state.selectedProductId)
        ) {
          state.selectedProductId = state.products[0].id;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load products';
      })
      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.selectedProductDetail = action.payload;
        // Keep products list in sync
        const idx = state.products.findIndex((p) => p.id === action.payload.id);
        const base: Product = {
          id: action.payload.id,
          name: action.payload.name,
          sku: action.payload.sku,
          price: action.payload.price,
          stockLabel: action.payload.stockLabel,
          status: action.payload.status,
          barcode: action.payload.barcode,
          description: action.payload.description,
          categoryId: action.payload.categoryId,
        };
        if (idx !== -1) {
          state.products[idx] = base;
        }
      })
      .addCase(fetchProductById.rejected, (state) => {
        state.detailStatus = 'failed';
      })
      // updateProduct
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.products.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.products[idx] = action.payload;
        if (state.selectedProductDetail?.id === action.payload.id) {
          state.selectedProductDetail = { ...state.selectedProductDetail, ...action.payload };
        }
      })
      // createProduct
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
        state.selectedProductId = action.payload.id;
      })
      // generateBarcode
      .addCase(generateBarcode.fulfilled, (state, action) => {
        const product = state.products.find((p) => p.id === action.payload.productId);
        if (product) product.barcode = action.payload.barcode;
        if (state.selectedProductDetail?.id === action.payload.productId) {
          state.selectedProductDetail.barcode = action.payload.barcode;
        }
      })
      // archiveProduct
      .addCase(archiveProduct.fulfilled, (state, action) => {
        const product = state.products.find((p) => p.id === action.payload);
        if (product) product.status = 'archived';
        if (state.selectedProductDetail?.id === action.payload) {
          state.selectedProductDetail.status = 'archived';
        }
      })
      // fetchProductVariants
      .addCase(fetchProductVariants.fulfilled, (state, action) => {
        if (state.selectedProductDetail?.id === action.payload.productId) {
          state.selectedProductDetail.variants = action.payload.variants;
        }
      })
      // addVariant
      .addCase(addVariant.fulfilled, (state, action) => {
        if (state.selectedProductDetail?.id === action.payload.productId) {
          state.selectedProductDetail.variants.push(action.payload.variant);
        }
      })
      // fetchProductStock
      .addCase(fetchProductStock.fulfilled, (state, action) => {
        if (state.selectedProductDetail?.id === action.payload.productId) {
          state.selectedProductDetail.stock = action.payload.stock;
        }
      })
      // fetchCategories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // fetchCategoryById
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selectedCategory = action.payload;
      })
      // createCategory
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      // moveCategory
      .addCase(moveCategory.fulfilled, (state, action) => {
        const category = state.categories.find((c) => c.id === action.payload.id);
        if (category) {
          category.parentId = action.payload.parentId;
          category.path = action.payload.path;
          category.level = action.payload.level;
        }
      })
      // fetchUnits
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.units = action.payload;
      });
  },
});

export const { selectProduct, setProducts, clearProductDetail } = catalogSlice.actions;
export default catalogSlice.reducer;
