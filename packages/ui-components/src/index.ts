/* Smart Retail OS — UI Components public API.
   Token-driven, RTL-aware, Arabic-first shared component library. */

export { HealthScreen } from './health-screen/HealthScreen';
export type { HealthStatus } from './health-screen/HealthScreen';
export { getTrialCountdownState } from './auth/trial-countdown';
export type { TrialCountdownState } from './auth/trial-countdown';
export { AuthShell } from './auth/auth-shell';
export type { AuthShellProps } from './auth/auth-shell';
export { Paywall } from './auth/paywall';
export type { PaywallProps } from './auth/paywall';

export { ProductCard } from './catalog/ProductCard';
export type { ProductCardProps } from './catalog/ProductCard';
export { VariantBadge } from './catalog/VariantBadge';
export type { VariantBadgeProps } from './catalog/VariantBadge';
export { UnitSelector } from './catalog/UnitSelector';
export type { UnitSelectorProps, UnitOption } from './catalog/UnitSelector';
export { BarcodeDisplay } from './catalog/BarcodeDisplay';
export type { BarcodeDisplayProps } from './catalog/BarcodeDisplay';
export { encodeBarcode, computeEan13CheckDigit } from './catalog/barcode';

export { CategoryTreeNode } from './categories/CategoryTreeNode';
export type { CategoryTreeNodeData, CategoryTreeNodeProps } from './categories/CategoryTreeNode';
export { CategoryBreadcrumb } from './categories/CategoryBreadcrumb';
export type { BreadcrumbSegment, CategoryBreadcrumbProps } from './categories/CategoryBreadcrumb';
export { UnitConversionBadge } from './categories/UnitConversionBadge';
export type { UnitConversionBadgeProps } from './categories/UnitConversionBadge';
export { UnitPickerModal } from './categories/UnitPickerModal';
export type { UnitPickerModalProps } from './categories/UnitPickerModal';

export { StockLevelBadge } from './inventory/StockLevelBadge';
export type { StockLevelBadgeProps } from './inventory/StockLevelBadge';
export { WarehouseSelector } from './inventory/WarehouseSelector';
export type { WarehouseSelectorProps } from './inventory/WarehouseSelector';
export { BatchSelector } from './inventory/BatchSelector';
export type { BatchSelectorProps } from './inventory/BatchSelector';

/* Core design-system components */
export {
  Modal,
  Field,
  EmptyState,
  Spinner,
  StatCard,
  Sidebar,
  NavItem,
  NavGroup,
  ToastProvider,
  useToast,
} from './components/ui';
export type { ModalProps, FieldProps, ToastType } from './components/ui';
export { StatusBadge } from './components/StatusBadge';
export type { StatusBadgeProps } from './components/StatusBadge';
export { Icon } from './components/Icon';
export type { IconName, IconProps } from './components/Icon';

/* Customer components */
export { CustomerCard } from './customers/CustomerCard';
export type { CustomerCardProps } from './customers/CustomerCard';
export { LoyaltyTierBadge } from './customers/LoyaltyTierBadge';
export type { LoyaltyTierBadgeProps } from './customers/LoyaltyTierBadge';
export { LoyaltyRedemptionDialog } from './customers/LoyaltyRedemptionDialog';
export type { LoyaltyRedemptionDialogProps } from './customers/LoyaltyRedemptionDialog';
export { CustomerSearchSheet } from './customers/CustomerSearchSheet';
export type { CustomerSearchSheetProps, CustomerSearchResult } from './customers/CustomerSearchSheet';

export { DigitalReceiptModal } from './pos/DigitalReceiptModal';
export type { DigitalReceiptModalProps, DigitalReceiptLine } from './pos/DigitalReceiptModal';

/* Sync (offline multi-device) components */
export { SyncStatusIndicator } from './sync/SyncStatusIndicator';
export type { SyncStatusIndicatorProps } from './sync/SyncStatusIndicator';
export { ConflictResolutionPanel } from './sync/ConflictResolutionPanel';
export type {
  ConflictResolutionPanelProps,
  ConflictWinner,
} from './sync/ConflictResolutionPanel';
export {
  SyncStore,
  syncStore,
  useSyncStore,
} from './stores/sync.store';
export type {
  SyncState,
  SyncStatusView,
  SyncConflictView,
  SyncTransportType,
} from './stores/sync.store';

/* i18n + formatting */
export { LocaleProvider, useLocale, useT, useTranslation, translate, DEFAULT_LOCALE, ARABIC_LOCALE } from './i18n/index';
export type { Locale, Dict } from './i18n/index';
export { formatNumber, formatMoney, formatDate } from './utils/format';
