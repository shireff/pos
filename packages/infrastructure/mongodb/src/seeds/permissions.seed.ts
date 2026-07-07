/* eslint-disable @typescript-eslint/no-explicit-any */
export const permissionCodes = [
  // Identity, Companies & Branches
  'company.view',
  'company.edit',
  'branch.view',
  'branch.create',
  'branch.edit',
  'branch.archive',
  'warehouse.view',
  'warehouse.create',
  'warehouse.edit',

  // Users, Roles & Permissions
  'users.view',
  'users.create',
  'users.edit',
  'users.deactivate',
  'roles.view',
  'roles.create_custom',
  'roles.edit',
  'roles.assign',
  'permissions.view_matrix',
  'shift.configure_hours',
  'approval_workflow.configure',

  // Product Catalog & Inventory
  'catalog.view',
  'catalog.create',
  'catalog.edit',
  'catalog.delete',
  'catalog.price.edit',
  'catalog.barcode.generate',
  'catalog.bundle.configure',
  'catalog.unit_conversion.edit',
  'inventory.view',
  'inventory.adjust',
  'inventory.adjust.approve',
  'inventory.batch.manage',
  'inventory.transfer.create',
  'inventory.transfer.approve',
  'inventory.transfer.receive',

  // Point of Sale
  'sales.create',
  'sales.view',
  'sales.discount.apply',
  'sales.discount.approve',
  'sales.void',
  'sales.refund.approve',
  'sales.return.create',
  'sales.cash_drawer.open_no_sale',
  'sales.shift.open_close',
  'sales.shift.reconciliation.view',

  // Purchasing & Suppliers
  'purchasing.supplier.view',
  'purchasing.supplier.manage',
  'purchasing.po.create',
  'purchasing.po.approve',
  'purchasing.po.receive',
  'purchasing.invoice.record',
  'purchasing.invoice.ocr_import',

  // Customers & Loyalty
  'customers.view',
  'customers.create',
  'customers.edit',
  'customers.credit.manage',
  'customers.loyalty.redeem',
  'customers.loyalty.configure',

  // Payments, Discounts, Promotions
  'payments.tender.record',
  'payments.provider.configure',
  'promotions.discount.create',
  'promotions.coupon.create',
  'promotions.campaign.manage',
  'promotions.view',

  // Taxes & Compliance
  'tax.rules.view',
  'tax.rules.edit',
  'tax.eta.activate_module',
  'tax.eta.submit_invoice',
  'tax.eta.view_status',

  // Warehousing & Stock Transfers
  'warehouse.central.designate',
  'warehouse.reorder_point.edit',
  'warehouse.reorder_point.accept_ai_suggestion',

  // Reports & Dashboards
  'reports.view.sales',
  'reports.view.financial',
  'reports.view.inventory',
  'reports.view.employees',
  'reports.view.customers',
  'reports.view.purchasing',
  'reports.branch_comparison.view',
  'reports.export',
  'reports.schedule_delivery',

  // Notifications
  'notifications.preferences.edit_own',
  'notifications.preferences.edit_others',
  'notifications.billing_trial.view',

  // AI Services
  'ai.assistant.use',
  'ai.predictions.view',
  'ai.recommendation.accept_reject',
  'ai.fraud_alerts.view',
  'ai.health_score.view',
  'ai.ocr.use',
  'ai.insight_feedback.submit',

  // Synchronization
  'sync.status.view',
  'sync.conflicts.view',
  'sync.conflicts.resolve',
  'sync.conflicts.resolve.security_sensitive',
  'sync.device.register',
  'sync.device.revoke',

  // Security
  'audit.view',
  'security.session.manage_own',
  'security.session.revoke_others',
  'security.encryption_status.view',

  // Administration (Company Settings)
  'settings.company.edit',
  'settings.branch.edit',
  'settings.hardware.configure',
  'settings.localization.edit',
  'devices.view',
  'devices.manage',

  // Backups & Restore
  'backup.trigger_manual',
  'backup.configure_schedule',
  'backup.restore',
  'backup.view_history',

  // Licensing & Subscription
  'subscription.view',
  'subscription.upgrade',
  'subscription.billing_history.view',

  // Export & Import
  'data.export.reports',
  'data.export.catalog',
  'data.export.customers',
  'data.import.catalog',

  // Platform Administration (separate system)
  'platform.accounts.view',
  'platform.accounts.plan.change',
  'platform.accounts.override.grant',
  'platform.accounts.suspend',
  'platform.accounts.reactivate',
  'platform.accounts.trial.extend',
  'platform.audit.view',
  'platform.admins.manage',
];

export async function seedPermissions(db: any) {
  const col = db.collection('permissions');
  for (const code of permissionCodes) {
    await col.updateOne(
      { code },
      { $setOnInsert: { code, created_at: new Date() } },
      { upsert: true },
    );
  }
}
