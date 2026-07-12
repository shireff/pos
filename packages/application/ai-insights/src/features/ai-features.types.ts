import type { IAIProvider, CompletionRequest } from '@packages/application-ai';
import { QueryClassifier } from '@packages/application-ai';
import { ContextAssembler } from '@packages/application-ai';
import { AIPrediction, AIRecommendation, HealthScoreSnapshot, AIInsightFeedback } from '@packages/domain-ai-insights';
import { AdvisoryOnlyGuard } from '@packages/domain-ai-insights';
import { FraudScorer, type FraudSignal } from '@packages/domain-ai-insights';
import { Identifier } from '@packages/shared-kernel';
import { logger } from '@packages/shared-kernel';

export interface AssistantCommand {
  question: string;
  companyId: string;
  branchId?: string | null;
  userId: string;
}

export interface SalesPredictionCommand {
  companyId: string;
  branchId: string | null;
  historicalData: { date: string; revenue: number }[];
  horizon: string;
}

export interface InventoryPredictionCommand {
  companyId: string;
  branchId: string | null;
  stockMovements: { date: string; quantity: number }[];
  productId: string;
}

export interface FraudDetectionCommand {
  companyId: string;
  branchId: string | null;
  transaction: {
    amount: number;
    discount: number;
    hour: number;
    cashierId: string;
    customerId?: string;
    voidRate: number;
    returnRate: number;
  };
}

export interface StoreHealthScoreCommand {
  companyId: string;
  branchId: string | null;
  kpis: {
    sales: { score: number; data: unknown };
    inventory: { score: number; data: unknown };
    financial: { score: number; data: unknown };
    employee: { score: number; data: unknown };
    customer: { score: number; data: unknown };
  };
}

export interface OcrCommand {
  companyId: string;
  userId: string;
  imageReference: string;
}

export interface DeadProductDetectionCommand {
  companyId: string;
  branchId: string | null;
  products: Array<{ id: string; name: string; lastSaleDate: string | null; stock: number }>;
  periodDays: number;
}

export interface CustomerSegmentationCommand {
  companyId: string;
  customers: Array<{
    id: string;
    recencyDays: number;
    frequency: number;
    monetary: number;
  }>;
}

export interface SmartAlertsCommand {
  companyId: string;
  branchId: string | null;
  currentDaySales: number;
  previousDaySales: number;
  paymentMethodSpikes: Array<{ method: string; currentRate: number; baselineRate: number }>;
}

export interface AnomalyDetectionCommand {
  companyId: string;
  branchId: string | null;
  metricName: string;
  values: number[];
  labels: string[];
}

export interface CashFlowPredictionCommand {
  companyId: string;
  branchId: string | null;
  historicalPayments: { date: string; inflow: number; outflow: number }[];
  horizonDays: number;
}
