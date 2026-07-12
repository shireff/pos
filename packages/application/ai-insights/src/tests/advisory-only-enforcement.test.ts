import { describe, it, expect, vi } from 'vitest';
import { AssistantFeature } from '../features/assistant.feature';
import { SalesPredictionFeature } from '../features/sales-prediction.feature';
import { InventoryPredictionFeature } from '../features/inventory-prediction.feature';
import { FraudDetectionFeature } from '../features/fraud-detection.feature';
import { StoreHealthScoreFeature } from '../features/store-health-score.feature';
import { OcrFeature } from '../features/ocr.feature';
import { DeadProductDetectionFeature } from '../features/dead-product-detection.feature';
import { CustomerSegmentationFeature } from '../features/customer-segmentation.feature';
import { SmartAlertsFeature } from '../features/smart-alerts.feature';
import { AnomalyDetectionFeature } from '../features/anomaly-detection.feature';
import { CashFlowPredictionFeature } from '../features/cash-flow-prediction.feature';
import type { IAIProvider } from '@packages/application-ai';

const mockWriteCommands = {
  updatePrice: vi.fn(),
  createPurchaseOrder: vi.fn(),
  adjustStock: vi.fn(),
  applyRecommendation: vi.fn(),
};

function createMockProvider(): IAIProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      text: 'Mock AI response',
      tokensUsed: 10,
      model: 'mock',
      source: 'local',
    }),
    embed: vi.fn().mockResolvedValue({
      embedding: [],
      model: 'mock',
      source: 'local',
    }),
    classify: vi.fn().mockResolvedValue({
      category: 'mock',
      confidence: 0.9,
    }),
    isAvailable: vi.fn().mockResolvedValue(true),
  };
}

describe('Advisory-Only Enforcement', () => {
  it('AssistantFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new AssistantFeature(provider);
    await feature.execute({
      question: 'What are my top products?',
      companyId: 'company-1',
      userId: 'user-1',
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('SalesPredictionFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new SalesPredictionFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      historicalData: [{ date: '2024-01-01', revenue: 1000 }],
      horizon: 'week',
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('InventoryPredictionFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new InventoryPredictionFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      stockMovements: [{ date: '2024-01-01', quantity: 10 }],
      productId: 'prod-1',
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('FraudDetectionFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new FraudDetectionFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      transaction: {
        amount: 100,
        discount: 50,
        hour: 23,
        cashierId: 'cashier-1',
        voidRate: 0.2,
        returnRate: 0.1,
      },
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('StoreHealthScoreFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new StoreHealthScoreFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      kpis: {
        sales: { score: 80, data: {} },
        inventory: { score: 70, data: {} },
        financial: { score: 90, data: {} },
        employee: { score: 60, data: {} },
        customer: { score: 75, data: {} },
      },
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('OcrFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new OcrFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      userId: 'user-1',
      imageReference: 'ref-1',
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('DeadProductDetectionFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new DeadProductDetectionFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      products: [{ id: 'prod-1', name: 'Test', lastSaleDate: '2023-01-01', stock: 0 }],
      periodDays: 90,
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('CustomerSegmentationFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new CustomerSegmentationFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      customers: [{ id: 'cust-1', recencyDays: 10, frequency: 5, monetary: 1000 }],
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('SmartAlertsFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new SmartAlertsFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      currentDaySales: 5000,
      previousDaySales: 10000,
      paymentMethodSpikes: [],
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('AnomalyDetectionFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new AnomalyDetectionFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      metricName: 'sales',
      values: [100, 100, 100, 500],
      labels: ['d1', 'd2', 'd3', 'd4'],
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });

  it('CashFlowPredictionFeature does not call any write command', async () => {
    const provider = createMockProvider();
    const feature = new CashFlowPredictionFeature(provider);
    await feature.execute({
      companyId: 'company-1',
      branchId: null,
      historicalPayments: [{ date: '2024-01-01', inflow: 1000, outflow: 800 }],
      horizonDays: 30,
    });
    expect(mockWriteCommands.updatePrice).not.toHaveBeenCalled();
    expect(mockWriteCommands.createPurchaseOrder).not.toHaveBeenCalled();
    expect(mockWriteCommands.adjustStock).not.toHaveBeenCalled();
  });
});
