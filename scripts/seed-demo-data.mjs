/**
 * Seed Script: Demo Tenant Data
 *
 * Creates a complete demo company with:
 *   - 1 company
 *   - 2 branches + 2 warehouses
 *   - Subscription (trialing)
 *   - System roles + permissions + role_permissions
 *   - 3 users (owner, manager, cashier) with hashed passwords
 *   - user_branch_roles assignments
 *   - Categories tree (3 root → children)
 *   - Units (base + conversion)
 *   - Products with variants
 *
 * Usage:
 *   node scripts/seed-demo-data.mjs
 *
 * Safe to run multiple times — skips already-existing data.
 */

import { MongoClient, Double } from 'mongodb';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env ────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'pos';
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid() { return crypto.randomUUID(); }
function now() { return new Date(); }

/** scrypt$<saltHex>$<keyHex> — same format as backend */
function hashPassword(password) {
  const saltHex = crypto.randomBytes(16).toString('hex');
  const saltBuffer = Buffer.from(saltHex, 'hex');
  const derived = crypto.scryptSync(password, saltBuffer, 64);
  return `scrypt$${saltHex}$${derived.toString('hex')}`;
}

/** upsert: insert only if _id doesn't exist */
async function upsert(col, doc) {
  try {
    await col.insertOne(doc);
    return 'inserted';
  } catch (e) {
    if (e.code === 11000) return 'skipped';
    throw e;
  }
}

// ─── IDs (stable — re-running produces same IDs) ──────────────────────────────

const IDS = {
  // Company
  company: 'demo-company-001',

  // Branches
  branchMain: 'demo-branch-main',
  branchSecond: 'demo-branch-second',

  // Warehouses
  warehouseMain: 'demo-warehouse-main',
  warehouseSecond: 'demo-warehouse-second',

  // Subscription
  subscription: 'demo-sub-001',

  // Roles
  roleOwner: 'demo-role-owner',
  roleManager: 'demo-role-manager',
  roleCashier: 'demo-role-cashier',

  // Users
  userOwner: 'demo-user-owner',
  userManager: 'demo-user-manager',
  userCashier: 'demo-user-cashier',

  // Categories
  catFood: 'demo-cat-food',
  catBeverages: 'demo-cat-beverages',
  catElectronics: 'demo-cat-electronics',
  catHotFood: 'demo-cat-hot-food',
  catColdDrinks: 'demo-cat-cold-drinks',

  // Units
  unitPiece: 'demo-unit-piece',
  unitBox: 'demo-unit-box',
  unitKg: 'demo-unit-kg',
  unitLiter: 'demo-unit-liter',

  // Products
  prodCola: 'demo-prod-cola',
  prodWater: 'demo-prod-water',
  prodPhone: 'demo-prod-phone',
  prodSandwich: 'demo-prod-sandwich',

  // Product variants
  variantCola250: 'demo-var-cola-250',
  variantCola500: 'demo-var-cola-500',
  variantWater: 'demo-var-water',
  variantPhone: 'demo-var-phone',
  variantSandwich: 'demo-var-sandwich',
};

// ─── Permission codes (from permission-matrix.ts) ─────────────────────────────

const OWNER_PERMS = [
  'company.view','company.edit','branch.view','branch.create','branch.edit','branch.archive',
  'warehouse.view','warehouse.create','warehouse.edit','users.view','users.create','users.edit','users.deactivate',
  'roles.view','roles.create_custom','roles.edit','roles.assign','permissions.view_matrix',
  'catalog.view','catalog.create','catalog.edit','catalog.delete','catalog.price.edit','catalog.barcode.generate',
  'inventory.view','inventory.adjust','inventory.batch.manage','inventory.transfer.create',
  'sales.create','sales.view','sales.discount.apply','sales.void','sales.return.create','sales.shift.open_close',
  'purchasing.supplier.view','purchasing.supplier.manage','purchasing.po.create','purchasing.po.approve','purchasing.po.receive',
  'customers.view','customers.create','customers.edit',
  'payments.tender.record','payments.provider.configure',
  'reports.view.sales','reports.view.financial','reports.view.inventory','reports.view.employees','reports.export',
  'audit.view','sync.status.view','sync.device.register',
  'settings.company.edit','settings.branch.edit','settings.hardware.configure',
  'devices.view','devices.manage',
  'backup.trigger_manual','backup.view_history','backup.restore',
  'subscription.view',
];

const MANAGER_PERMS = [
  'branch.view','warehouse.view','inventory.view','inventory.adjust','inventory.batch.manage',
  'sales.create','sales.view','sales.discount.apply','sales.shift.open_close',
  'users.view','roles.view','catalog.view','catalog.create','catalog.edit',
  'reports.view.sales','reports.view.inventory','sync.status.view',
  'customers.view','customers.create','customers.edit','subscription.view',
];

const CASHIER_PERMS = [
  'sales.create','sales.view','customers.view','customers.create',
  'payments.tender.record','subscription.view',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);

  const stats = { inserted: 0, skipped: 0 };

  async function ins(col, doc) {
    const r = await upsert(db.collection(col), doc);
    if (r === 'inserted') { stats.inserted++; process.stdout.write('.'); }
    else { stats.skipped++; process.stdout.write('s'); }
  }

  console.log('\n🌱 Seeding demo data...\n');
  const n = now();

  // ── 1. Company ──────────────────────────────────────────────────────────────
  console.log('1. Company');
  await ins('companies', {
    _id: IDS.company,
    name: 'شركة ديمو للتجزئة',
    business_type: 'retail',
    default_currency: 'EGP',
    default_language: 'ar',
    timezone: 'Africa/Cairo',
    eta_enabled: false,
    is_deleted: false,
    sync_version: 1,
    created_at: n,
    updated_at: n,
  });

  // ── 2. Branches ─────────────────────────────────────────────────────────────
  console.log('\n2. Branches');
  await ins('branches', {
    _id: IDS.branchMain,
    company_id: IDS.company,
    name: 'الفرع الرئيسي - القاهرة',
    address: '15 شارع التحرير، القاهرة',
    is_active: true,
    created_at: n,
    updated_at: n,
  });
  await ins('branches', {
    _id: IDS.branchSecond,
    company_id: IDS.company,
    name: 'فرع الإسكندرية',
    address: '8 شارع الكورنيش، الإسكندرية',
    is_active: true,
    created_at: n,
    updated_at: n,
  });

  // ── 3. Warehouses ────────────────────────────────────────────────────────────
  console.log('\n3. Warehouses');
  await ins('warehouses', {
    _id: IDS.warehouseMain,
    company_id: IDS.company,
    name: 'مخزن القاهرة الرئيسي',
    address: '15 شارع التحرير، القاهرة',
    is_active: true,
    created_at: n,
    updated_at: n,
  });
  await ins('warehouses', {
    _id: IDS.warehouseSecond,
    company_id: IDS.company,
    name: 'مخزن الإسكندرية',
    address: '8 شارع الكورنيش، الإسكندرية',
    is_active: true,
    created_at: n,
    updated_at: n,
  });

  // ── 4. Subscription ──────────────────────────────────────────────────────────
  console.log('\n4. Subscription');
  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  // Try 'trialing' first (migration 002b schema), fall back to 'trial' (migration 001 schema)
  const subDoc = {
    _id: IDS.subscription,
    company_id: IDS.company,
    plan_id: null,
    trial_started_at: trialStart,
    trial_ends_at: trialEnd,
    created_at: n,
    updated_at: n,
  };
  const existing = await db.collection('subscriptions').findOne({ _id: IDS.subscription });
  if (!existing) {
    let inserted = false;
    for (const statusVal of ['trialing', 'trial', 'active']) {
      try {
        await db.collection('subscriptions').insertOne({ ...subDoc, status: statusVal });
        stats.inserted++; process.stdout.write('.');
        inserted = true;
        break;
      } catch (e) {
        if (e.code !== 121 && e.code !== 11000) throw e;
      }
    }
    if (!inserted) { stats.skipped++; process.stdout.write('s'); }
  } else { stats.skipped++; process.stdout.write('s'); }

  // ── 5. Permissions ───────────────────────────────────────────────────────────
  console.log('\n5. Permissions');
  const allPerms = [...new Set([...OWNER_PERMS, ...MANAGER_PERMS, ...CASHIER_PERMS])];
  const permIdMap = {};
  const permDocs = [];
  for (const code of allPerms) {
    const id = `perm-${IDS.company}-${code.replace(/\./g, '-')}`;
    permIdMap[code] = id;
    const [module, ...rest] = code.split('.');
    permDocs.push({
      _id: id, company_id: IDS.company, code, module, action: rest.join('.'),
      is_system: true, is_deleted: false, created_at: n, updated_at: n,
    });
  }
  const permResult = await db.collection('permissions').bulkWrite(
    permDocs.map(doc => ({ insertOne: { document: doc } })),
    { ordered: false }
  ).catch(e => e.result ?? { insertedCount: 0 });
  const permInserted = permResult?.insertedCount ?? 0;
  stats.inserted += permInserted; stats.skipped += permDocs.length - permInserted;
  process.stdout.write(`(${permInserted} ins, ${permDocs.length - permInserted} skip)`);

  // ── 6. Roles ─────────────────────────────────────────────────────────────────
  console.log('\n6. Roles');
  const rolePermsMap = {
    [IDS.roleOwner]: OWNER_PERMS,
    [IDS.roleManager]: MANAGER_PERMS,
    [IDS.roleCashier]: CASHIER_PERMS,
  };
  await ins('roles', { _id: IDS.roleOwner,   company_id: IDS.company, name: 'Owner',           is_system_role: true, permission_ids: OWNER_PERMS.map(c => permIdMap[c]),   is_deleted: false, created_at: n, updated_at: n });
  await ins('roles', { _id: IDS.roleManager, company_id: IDS.company, name: 'Branch Manager',  is_system_role: true, permission_ids: MANAGER_PERMS.map(c => permIdMap[c]), is_deleted: false, created_at: n, updated_at: n });
  await ins('roles', { _id: IDS.roleCashier, company_id: IDS.company, name: 'Cashier',         is_system_role: true, permission_ids: CASHIER_PERMS.map(c => permIdMap[c]), is_deleted: false, created_at: n, updated_at: n });

  // ── 7. Role Permissions (join table) ─────────────────────────────────────────
  console.log('\n7. Role-Permissions');
  const rpDocs = [];
  for (const [roleId, perms] of Object.entries(rolePermsMap)) {
    for (const code of perms) {
      rpDocs.push({
        _id: `rp-${roleId}-${permIdMap[code]}`,
        role_id: roleId,
        permission_id: permIdMap[code],
        created_at: n,
      });
    }
  }
  // Bulk insert, ignore duplicate key errors
  const rpResult = await db.collection('role_permissions').bulkWrite(
    rpDocs.map(doc => ({ insertOne: { document: doc } })),
    { ordered: false }
  ).catch(e => e.result ?? { insertedCount: 0 });
  const rpInserted = rpResult?.insertedCount ?? 0;
  const rpSkipped = rpDocs.length - rpInserted;
  stats.inserted += rpInserted;
  stats.skipped += rpSkipped;
  process.stdout.write(`(${rpInserted} ins, ${rpSkipped} skip)`);

  // ── 8. Users ─────────────────────────────────────────────────────────────────
  console.log('\n8. Users');
  await ins('users', {
    _id: IDS.userOwner,
    company_id: IDS.company,
    name: 'أحمد محمد',
    email: 'owner@demo.local',
    password_hash: hashPassword('Owner@2026'),
    is_active: true,
    default_branch_id: IDS.branchMain,
    is_deleted: false,
    sync_version: 1,
    created_at: n,
    updated_at: n,
  });
  await ins('users', {
    _id: IDS.userManager,
    company_id: IDS.company,
    name: 'سارة خالد',
    email: 'manager@demo.local',
    password_hash: hashPassword('Manager@2026'),
    is_active: true,
    default_branch_id: IDS.branchMain,
    is_deleted: false,
    sync_version: 1,
    created_at: n,
    updated_at: n,
  });
  await ins('users', {
    _id: IDS.userCashier,
    company_id: IDS.company,
    name: 'محمد علي',
    email: 'cashier@demo.local',
    password_hash: hashPassword('Cashier@2026'),
    is_active: true,
    default_branch_id: IDS.branchMain,
    is_deleted: false,
    sync_version: 1,
    created_at: n,
    updated_at: n,
  });

  // ── 9. User Branch Roles ──────────────────────────────────────────────────────
  console.log('\n9. User-Branch-Roles');
  await ins('user_branch_roles', { _id: `ubr-owner-main`,    user_id: IDS.userOwner,   branch_id: IDS.branchMain,   role_id: IDS.roleOwner,   created_at: n });
  await ins('user_branch_roles', { _id: `ubr-owner-second`,  user_id: IDS.userOwner,   branch_id: IDS.branchSecond, role_id: IDS.roleOwner,   created_at: n });
  await ins('user_branch_roles', { _id: `ubr-mgr-main`,      user_id: IDS.userManager, branch_id: IDS.branchMain,   role_id: IDS.roleManager, created_at: n });
  await ins('user_branch_roles', { _id: `ubr-cashier-main`,  user_id: IDS.userCashier, branch_id: IDS.branchMain,   role_id: IDS.roleCashier, created_at: n });

  // ── 10. Units ─────────────────────────────────────────────────────────────────
  console.log('\n10. Units');
  // conversion_factor_to_base MUST be BSON Double — use Double() to force correct type
  await ins('units', { _id: IDS.unitPiece,  company_id: IDS.company, name: { ar: 'قطعة',  en: 'Piece'  }, abbreviation: 'pcs', is_base_unit: true,  conversion_factor_to_base: new Double(1.0),  is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('units', { _id: IDS.unitBox,    company_id: IDS.company, name: { ar: 'كرتون', en: 'Box'    }, abbreviation: 'box', is_base_unit: false, conversion_factor_to_base: new Double(12.0), is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('units', { _id: IDS.unitKg,     company_id: IDS.company, name: { ar: 'كيلو',  en: 'Kg'     }, abbreviation: 'kg',  is_base_unit: true,  conversion_factor_to_base: new Double(1.0),  is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('units', { _id: IDS.unitLiter,  company_id: IDS.company, name: { ar: 'لتر',   en: 'Liter'  }, abbreviation: 'L',   is_base_unit: true,  conversion_factor_to_base: new Double(1.0),  is_deleted: false, sync_version: 1, created_at: n, updated_at: n });

  // ── 11. Categories ────────────────────────────────────────────────────────────
  console.log('\n11. Categories');
  // Note: hlc_timestamp excluded — migration 005 may not have run yet
  await ins('categories', { _id: IDS.catFood,        company_id: IDS.company, name: { ar: 'مواد غذائية', en: 'Food'       }, parent_id: null,             level: 0, path: IDS.catFood,                                    sort_order: 1, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('categories', { _id: IDS.catBeverages,   company_id: IDS.company, name: { ar: 'مشروبات',     en: 'Beverages'  }, parent_id: null,             level: 0, path: IDS.catBeverages,                               sort_order: 2, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('categories', { _id: IDS.catElectronics, company_id: IDS.company, name: { ar: 'إلكترونيات',  en: 'Electronics'}, parent_id: null,             level: 0, path: IDS.catElectronics,                             sort_order: 3, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('categories', { _id: IDS.catHotFood,     company_id: IDS.company, name: { ar: 'أكل ساخن',    en: 'Hot Food'   }, parent_id: IDS.catFood,      level: 1, path: `${IDS.catFood}/${IDS.catHotFood}`,             sort_order: 1, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('categories', { _id: IDS.catColdDrinks,  company_id: IDS.company, name: { ar: 'مشروبات باردة',en: 'Cold Drinks'}, parent_id: IDS.catBeverages, level: 1, path: `${IDS.catBeverages}/${IDS.catColdDrinks}`,     sort_order: 1, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });

  // ── 12. Products ──────────────────────────────────────────────────────────────
  console.log('\n12. Products');
  await ins('products', { _id: IDS.prodCola,     company_id: IDS.company, name: 'كوكاكولا',       sku: 'COLA-001', barcode: '6221234000001', category_id: IDS.catColdDrinks,  base_unit_id: IDS.unitPiece, status: 'active', cost_price_piasters: 800,  selling_price_piasters: 1200, is_bundle: false, is_serialized: false, requires_batch_tracking: false, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('products', { _id: IDS.prodWater,    company_id: IDS.company, name: 'مياه معدنية',    sku: 'WATER-001',barcode: '6221234000002', category_id: IDS.catColdDrinks,  base_unit_id: IDS.unitPiece, status: 'active', cost_price_piasters: 300,  selling_price_piasters: 500,  is_bundle: false, is_serialized: false, requires_batch_tracking: false, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('products', { _id: IDS.prodPhone,    company_id: IDS.company, name: 'موبايل سامسونج', sku: 'PHONE-001',barcode: '6221234000003', category_id: IDS.catElectronics, base_unit_id: IDS.unitPiece, status: 'active', cost_price_piasters: 1500000, selling_price_piasters: 1800000, is_bundle: false, is_serialized: true, requires_batch_tracking: false, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });
  await ins('products', { _id: IDS.prodSandwich, company_id: IDS.company, name: 'ساندوتش فراخ',   sku: 'SAND-001', barcode: '6221234000004', category_id: IDS.catHotFood,     base_unit_id: IDS.unitPiece, status: 'active', cost_price_piasters: 2000, selling_price_piasters: 3500,  is_bundle: false, is_serialized: false, requires_batch_tracking: false, is_deleted: false, sync_version: 1, created_at: n, updated_at: n });

  // ── 13. Product Variants ──────────────────────────────────────────────────────
  console.log('\n13. Product Variants');
  await ins('product_variants', { _id: IDS.variantCola250,  product_id: IDS.prodCola,     sku: 'COLA-250ML',  barcode: '6221234000011', name: '250 مل',  price_piasters: 1000, cost_piasters: 700,  additional_price_piasters: 0, attributes_json: { size: '250ml' }, is_deleted: false, created_at: n, updated_at: n });
  await ins('product_variants', { _id: IDS.variantCola500,  product_id: IDS.prodCola,     sku: 'COLA-500ML',  barcode: '6221234000012', name: '500 مل',  price_piasters: 1500, cost_piasters: 900,  additional_price_piasters: 0, attributes_json: { size: '500ml' }, is_deleted: false, created_at: n, updated_at: n });
  await ins('product_variants', { _id: IDS.variantWater,    product_id: IDS.prodWater,    sku: 'WATER-500ML', barcode: '6221234000021', name: '500 مل',  price_piasters: 500,  cost_piasters: 300,  additional_price_piasters: 0, attributes_json: { size: '500ml' }, is_deleted: false, created_at: n, updated_at: n });
  await ins('product_variants', { _id: IDS.variantPhone,    product_id: IDS.prodPhone,    sku: 'PHONE-BLK',   barcode: '6221234000031', name: 'أسود',    price_piasters: 1800000, cost_piasters: 1500000, additional_price_piasters: 0, attributes_json: { color: 'black' }, is_deleted: false, created_at: n, updated_at: n });
  await ins('product_variants', { _id: IDS.variantSandwich, product_id: IDS.prodSandwich, sku: 'SAND-REG',    barcode: '6221234000041', name: 'عادي',    price_piasters: 3500, cost_piasters: 2000, additional_price_piasters: 0, attributes_json: {}, is_deleted: false, created_at: n, updated_at: n });

  await client.close();

  console.log(`\n\n✅ Done! ${stats.inserted} inserted, ${stats.skipped} skipped.\n`);
  console.log('────────────────────────────────────────────────────');
  console.log('  Company   : شركة ديمو للتجزئة  (ID: demo-company-001)');
  console.log('  Branches  : الفرع الرئيسي - القاهرة  |  فرع الإسكندرية');
  console.log('  Trial     : 14 يوم');
  console.log('');
  console.log('  Users:');
  console.log('    owner@demo.local    — Password: Owner@2026    — Role: Owner');
  console.log('    manager@demo.local  — Password: Manager@2026  — Role: Branch Manager');
  console.log('    cashier@demo.local  — Password: Cashier@2026  — Role: Cashier');
  console.log('');
  console.log('  Company ID for login: demo-company-001');
  console.log('────────────────────────────────────────────────────\n');
}

main().catch(err => { console.error('\n❌ Seed failed:', err.message); process.exit(1); });
