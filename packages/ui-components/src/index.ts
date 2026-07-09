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

/* i18n + formatting */
export { LocaleProvider, useLocale, useT, translate, DEFAULT_LOCALE, ARABIC_LOCALE } from './i18n/index';
export type { Locale, Dict } from './i18n/index';
export { formatNumber, formatMoney, formatDate } from './utils/format';
