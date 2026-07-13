export enum ApiEndpoints {
    // ── Auth ──────────────────────────────────────────────────────
    AuthLogin = '/api/auth/login',
    AuthRefresh = '/api/auth/refresh',
    AuthLogout = '/api/auth/logout',
    AuthMe = '/api/auth/me',
    AuthPin = '/api/auth/pin',

    // ── Platform Admin ────────────────────────────────────────────
    PlatformAdminLogin = '/api/platform-admin/auth/login',
    PlatformAdminMfaVerify = '/api/platform-admin/auth/mfa-verify',
    PlatformAdminLogout = '/api/platform-admin/auth/logout',
    PlatformAdminAccounts = '/api/platform-admin/accounts',
    PlatformAdminAccountDetail = '/api/platform-admin/accounts/:companyId',
    PlatformAdminAccountPlan = '/api/platform-admin/accounts/:companyId/plan',
    PlatformAdminAccountSuspend = '/api/platform-admin/accounts/:companyId/suspend',
    PlatformAdminAccountReactivate = '/api/platform-admin/accounts/:companyId/reactivate',
    PlatformAdminAccountTrialExtend = '/api/platform-admin/accounts/:companyId/trial/extend',
    PlatformAdminAudit = '/api/platform-admin/audit',

    // ── Devices & Subscription ────────────────────────────────────
    DevicesRegister = '/api/devices/register',
    Subscription = '/api/subscription',
    SubscriptionUpgrade = '/api/subscription/upgrade',
    Health = '/api/health',

    // ── Catalog — Products ────────────────────────────────────────
    Products = '/api/v1/products',
    ProductById = '/api/v1/products/:id',
    ProductVariants = '/api/v1/products/:id/variants',
    ProductStock = '/api/v1/products/:id/stock',
    ProductBarcode = '/api/v1/products/:id/barcode',
    ProductArchive = '/api/v1/products/:id/archive',

    // ── Catalog — Categories ──────────────────────────────────────
    Categories = '/api/v1/categories',
    CategoryById = '/api/v1/categories/:id',
    CategoryMove = '/api/v1/categories/:id/move',

    // ── Catalog — Units ───────────────────────────────────────────
    Units = '/api/v1/units',
    UnitById = '/api/v1/units/:id',

  // ── Sales / Orders ────────────────────────────────────────────
  Orders = '/api/v1/orders',
  OrderById = '/api/v1/orders/:id',
  OrderReturn = '/api/v1/orders/:id/returns',
  OrderReturnApprove = '/api/v1/orders/:id/returns/:returnId/approve',
  OrderVoid = '/api/v1/orders/:id/void',

  // ── Sales / Shifts ──────────────────────────────────────────
  ShiftOpen = '/api/v1/shifts',
  ShiftCurrent = '/api/v1/shifts/current',
  ShiftClose = '/api/v1/shifts/current/close',

    // ── Inventory / Stock ─────────────────────────────────────────
    Warehouses = '/api/v1/warehouses',
    StockAdjustments = '/api/v1/stock/adjustments',
    StockTransfers = '/api/v1/stock/transfers',
    StockTransferSubmit = '/api/v1/stock/transfers/:id/submit',
    StockTransferApprove = '/api/v1/stock/transfers/:id/approve',
    StockTransferShip = '/api/v1/stock/transfers/:id/ship',
    StockTransferReceive = '/api/v1/stock/transfers/:id/receive',
    StockTransferCancel = '/api/v1/stock/transfers/:id/cancel',
    StockMovements = '/api/v1/stock/movements',

    // ── Purchasing ────────────────────────────────────────────────
    PurchaseOrders = '/api/v1/purchase-orders',
    PurchaseOrderById = '/api/v1/purchase-orders/:id',
    PurchaseOrderSubmit = '/api/v1/purchase-orders/:id/submit',
    PurchaseOrderApprove = '/api/v1/purchase-orders/:id/approve',
    PurchaseOrderReject = '/api/v1/purchase-orders/:id/reject',
    PurchaseOrderCancel = '/api/v1/purchase-orders/:id/cancel',
    PurchaseOrderReceive = '/api/v1/purchase-orders/:id/receive',
    PurchaseOrderInvoice = '/api/v1/purchase-orders/:id/invoice',
    PurchaseOrderOcr = '/api/v1/purchase-orders/:id/ocr',
    SupplierInvoiceOcr = '/api/v1/supplier-invoices/ocr',

    // ── Customers ─────────────────────────────────────────────────
    Customers = '/api/v1/customers',
    CustomerById = '/api/v1/customers/:id',
    CustomerLoyaltyRedeem = '/api/v1/customers/:id/loyalty/redeem',
    CustomerLoyaltyHistory = '/api/v1/customers/:id/loyalty/history',
    CustomerCreditPayments = '/api/v1/customers/:id/credit/payments',
    CustomerCreditHistory = '/api/v1/customers/:id/credit/history',
    CustomerMerge = '/api/v1/customers/merge',

    // ── Suppliers ─────────────────────────────────────────────────
    Suppliers = '/api/v1/suppliers',
    SupplierById = '/api/v1/suppliers/:id',
    SupplierLedger = '/api/v1/suppliers/:id/ledger',
    SupplierPayments = '/api/v1/suppliers/:id/payments',
    SupplierCreditNotes = '/api/v1/suppliers/:id/credit-notes',
    SupplierPerformance = '/api/v1/suppliers/:id/performance',
    SupplierPriceHistory = '/api/v1/suppliers/:id/price-history',

    // ── Reports ───────────────────────────────────────────────────
    ReportsDailySales = '/api/v1/reports/daily-sales',
    ReportsProfitLoss = '/api/v1/reports/profit-loss',
    ReportsInventoryValuation = '/api/v1/reports/inventory-valuation',
    ReportsStockMovements = '/api/v1/reports/stock-movements',
    ReportsBranchComparison = '/api/v1/reports/branch-comparison',
    ReportsEmployeePerformance = '/api/v1/reports/employee-performance',
    ReportsCustomerLoyalty = '/api/v1/reports/customer-loyalty',
    ReportsTax = '/api/v1/reports/tax',
    ReportsSupplierPerformance = '/api/v1/reports/supplier-performance',
    ReportsStoreHealth = '/api/v1/reports/store-health',
    ReportsCashFlow = '/api/v1/reports/cash-flow',

    // ── AI ────────────────────────────────────────────────────────
    AiAssistantQuery = '/api/v1/ai/assistant',
    AiInsights = '/api/v1/ai/insights',
    AiInsightFeedback = '/api/v1/ai/insights/:id/feedback',
    AiOcr = '/api/v1/ai/ocr',

  // ── Sync ──────────────────────────────────────────────────────
  SyncPush = '/api/v1/sync/push',
  SyncPull = '/api/v1/sync/pull',
  SyncConflicts = '/api/v1/sync/conflicts',
  SyncConflictResolve = '/api/v1/sync/conflicts/:id/resolve',

  // ── Promotions ────────────────────────────────────────────────
  DiscountRules = '/api/v1/discount-rules',
  DiscountRuleById = '/api/v1/discount-rules/:id',
  DiscountRuleDeactivate = '/api/v1/discount-rules/:id/deactivate',
  Coupons = '/api/v1/coupons',
  CouponValidate = '/api/v1/coupons/validate',

  // ── Tax ───────────────────────────────────────────────────────
  TaxRules = '/api/v1/tax-rules',
  TaxRuleApplicable = '/api/v1/tax-rules/applicable',

  // ── Pricing ───────────────────────────────────────────────────
  PriceChanges = '/api/v1/price-changes',
  PriceChangeApprove = '/api/v1/price-changes/:id/approve',
  PriceChangeReject = '/api/v1/price-changes/:id/reject',

  // ── Notifications (Phase 14) ─────────────────────────────────
  Notifications = '/api/v1/notifications',
  NotificationMarkRead = '/api/v1/notifications/:id/read',
  NotificationsReadAll = '/api/v1/notifications/read-all',
  NotificationPreferences = '/api/v1/notification-preferences',

  // ── Backup & Restore (Phase 17) ──────────────────────────────
  Backups = '/api/v1/backups',
  BackupById = '/api/v1/backups/:id',
  BackupRestore = '/api/v1/backups/:id/restore',
  BackupVerify = '/api/v1/backups/:id/verify',
}

export function buildEndpoint(
    endpoint: ApiEndpoints,
    params: Record<string, string> = {},
): string {
    let built = endpoint as string;
    Object.entries(params).forEach(([key, value]) => {
        built = built.replace(`:${key}`, encodeURIComponent(value));
    });
    return built;
}
