/* eslint-disable @typescript-eslint/no-explicit-any */
export const subscriptionPlans = [
  {
    code: 'basic',
    name: 'Basic',
    monthlyPricePiasters: 500,
    annualPricePiasters: 5000,
    maxUsers: 5,
    featureFlags: {
      aiAssistant: false,
      ocr: false,
      fraudDetection: false,
      customRoles: false,
      branchLimit: 1,
      userLimit: 5,
    },
  },
  {
    code: 'pro',
    name: 'Pro',
    monthlyPricePiasters: 1500,
    annualPricePiasters: 15000,
    maxUsers: 20,
    featureFlags: {
      aiAssistant: true,
      ocr: true,
      fraudDetection: true,
      customRoles: true,
      branchLimit: 5,
      userLimit: 20,
    },
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    monthlyPricePiasters: 5000,
    annualPricePiasters: 50000,
    maxUsers: 100,
    featureFlags: {
      aiAssistant: true,
      ocr: true,
      fraudDetection: true,
      customRoles: true,
      branchLimit: null,
      userLimit: null,
    },
  },
];

export async function seedSubscriptionPlans(db: any) {
  const col = db.collection('subscription_plans');
  for (const p of subscriptionPlans) {
    await col.updateOne(
      { code: p.code },
      { $setOnInsert: { ...p, createdAt: new Date().toISOString() } },
      { upsert: true },
    );
  }
}
