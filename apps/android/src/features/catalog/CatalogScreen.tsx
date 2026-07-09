/**
 * CatalogScreen — Android
 * Thin wrapper around ProductListPage kept for backwards compatibility.
 * All logic and API calls live in ProductListPage.
 */
import { ProductListPage } from './ProductListPage';

export function CatalogScreen() {
  return <ProductListPage />;
}
