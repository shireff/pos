export enum ApiEndpoints {
  AuthLogin = '/api/auth/login',
  AuthRefresh = '/api/auth/refresh',
  AuthLogout = '/api/auth/logout',
  AuthMe = '/api/auth/me',
  PlatformAdminLogin = '/api/platform-admin/auth/login',
  PlatformAdminMfaVerify = '/api/platform-admin/auth/mfa-verify',
  PlatformAdminAccounts = '/api/platform-admin/accounts',
  PlatformAdminAccountDetail = '/api/platform-admin/accounts/:companyId',
  PlatformAdminAccountPlan = '/api/platform-admin/accounts/:companyId/plan',
  PlatformAdminAccountSuspend = '/api/platform-admin/accounts/:companyId/suspend',
  PlatformAdminAccountReactivate = '/api/platform-admin/accounts/:companyId/reactivate',
  PlatformAdminAccountTrialExtend = '/api/platform-admin/accounts/:companyId/trial/extend',
  DevicesRegister = '/api/devices/register',
  Subscription = '/api/subscription',
  Health = '/api/health',
  Products = '/api/v1/products',
  ProductById = '/api/v1/products/:id',
  ProductVariants = '/api/v1/products/:id/variants',
  ProductStock = '/api/v1/products/:id/stock',
  ProductBarcode = '/api/v1/products/:id/barcode',
  ProductArchive = '/api/v1/products/:id/archive',
  Categories = '/api/v1/categories',
  CategoryById = '/api/v1/categories/:id',
  UnitById = '/api/v1/units/:id',
  CategoryMove = '/api/v1/categories/:id/move',
  Units = '/api/v1/units',
}

export function buildEndpoint(endpoint: ApiEndpoints, params: Record<string, string> = {}): string {
  let built = endpoint as string;
  Object.entries(params).forEach(([key, value]) => {
    built = built.replace(`:${key}`, encodeURIComponent(value));
  });
  return built;
}
