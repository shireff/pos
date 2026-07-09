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

    // ── Inventory / Stock ─────────────────────────────────────────
    StockAdjustments = '/api/v1/stock/adjustments',
    StockTransfers = '/api/v1/stock/transfers',
    StockTransferApprove = '/api/v1/stock/transfers/:id/approve',
    StockTransferShip = '/api/v1/stock/transfers/:id/ship',
    StockTransferReceive = '/api/v1/stock/transfers/:id/receive',
    StockMovements = '/api/v1/stock/movements',

    // ── Purchasing ────────────────────────────────────────────────
    PurchaseOrders = '/api/v1/purchase-orders',
    PurchaseOrderApprove = '/api/v1/purchase-orders/:id/approve',
    PurchaseOrderReceive = '/api/v1/purchase-orders/:id/receive',
    SupplierInvoiceOcr = '/api/v1/supplier-invoices/ocr',

    // ── Customers ─────────────────────────────────────────────────
    Customers = '/api/v1/customers',
    CustomerById = '/api/v1/customers/:id',
    CustomerLoyaltyRedeem = '/api/v1/customers/:id/loyalty/redeem',

    // ── Reports ───────────────────────────────────────────────────
    ReportsDailySales = '/api/v1/reports/daily-sales',
    ReportsProfitLoss = '/api/v1/reports/profit-loss',

    // ── AI ────────────────────────────────────────────────────────
    AiAssistantQuery = '/api/v1/ai/assistant/query',
    AiPredictionsSales = '/api/v1/ai/predictions/sales',
    AiHealthScore = '/api/v1/ai/health-score',
    AiInsightFeedback = '/api/v1/ai/insights/:id/feedback',

    // ── Sync ──────────────────────────────────────────────────────
    SyncPush = '/api/v1/sync/push',
    SyncPull = '/api/v1/sync/pull',
    SyncConflicts = '/api/v1/sync/conflicts',
    SyncConflictResolve = '/api/v1/sync/conflicts/:id/resolve',
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
