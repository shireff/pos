export type AIInsightType =
  | 'sales_prediction'
  | 'inventory_prediction'
  | 'fraud_alert'
  | 'dead_product'
  | 'health_score'
  | 'anomaly'
  | 'customer_segment'
  | 'cash_flow_prediction'
  | 'branch_comparison'
  | 'supplier_suggestion'
  | 'dynamic_pricing';

export type AIRecommendationState = 'generated' | 'presented' | 'accepted' | 'rejected' | 'expired';

export type AIProviderSource =
  | 'local'
  | 'nara_router:kimi-k2.7-code-free'
  | 'nara_router:mistral-large'
  | 'nara_router:mistral-medium-3-5';

export type HealthSubScore = 'sales' | 'inventory' | 'financial' | 'employee' | 'customer';
