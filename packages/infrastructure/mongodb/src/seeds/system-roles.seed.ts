/* eslint-disable @typescript-eslint/no-explicit-any */
export const systemRoles = [
  'Owner',
  'Company Administrator',
  'Branch Manager',
  'Assistant Manager',
  'Cashier',
  'Inventory Manager',
  'Warehouse Employee',
  'Purchasing Officer',
  'Sales Employee',
  'Accountant',
  'Financial Manager',
  'Auditor',
  'Customer Service',
  'Marketing Employee',
  'Delivery Employee',
  'Technical Support',
  'Read-only User',
];

export async function seedSystemRoles(db: any) {
  const col = db.collection('roles');
  for (const name of systemRoles) {
    await col.updateOne(
      { name },
      { $setOnInsert: { name, isSystemRole: true, createdAt: new Date().toISOString() } },
      { upsert: true },
    );
  }
}
