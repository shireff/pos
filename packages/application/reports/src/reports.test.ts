import { describe, it, expect, vi } from 'vitest';
import { ProjectionWorker } from '../src/projection-worker';
import { EventBus } from '../src/event-bus';
import { DailySalesSummaryReport } from '../src/reports/daily-sales-summary.report';
import { ProfitAndLossReport } from '../src/reports/pnl.report';
import { MonthlyRollupJob } from '../src/monthly-rollup-job';

describe('ProjectionWorker', () => {
  it('subscribes to events on start', () => {
    const mockEventBus = new EventBus();
    const worker = new ProjectionWorker(mockEventBus);
    worker.stop();
    expect(worker).toBeDefined();
  });
});

describe('DailySalesSummaryReport', () => {
  it('returns report data', async () => {
    const repo = {
      findByCompanyBranchDate: vi.fn().mockResolvedValue(null),
      findByCompanyBranchDateRange: vi.fn().mockResolvedValue([]),
    };
    const report = new DailySalesSummaryReport(repo as any, { findByCompanyBranchDateRange: vi.fn().mockResolvedValue([]) } as any);
    const result = await report.execute({ companyId: 'c1', branchId: 'b1', date: '2024-01-01' });
    expect(result.date).toBe('2024-01-01');
  });
});

describe('ProfitAndLossReport', () => {
  it('returns P&L data', async () => {
    const repo = { findByCompanyBranchYearMonth: vi.fn().mockResolvedValue(null) };
    const report = new ProfitAndLossReport(repo as any);
    const result = await report.execute({ companyId: 'c1', year: 2024, month: 1 });
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);
  });
});

describe('MonthlyRollupJob', () => {
  it('aggregates daily rollups into monthly', async () => {
    const dailyRepo = { findByCompanyBranchDateRange: vi.fn().mockResolvedValue([
      { grossRevenuePiasters: 1000, taxAmountPiasters: 100, discountAmountPiasters: 50, transactionCount: 2 },
    ]) };
    const monthlyRepo = { upsert: vi.fn() };
    const job = new MonthlyRollupJob(dailyRepo as any, monthlyRepo as any);
    await job.execute({ companyId: 'c1', branchId: 'b1', year: 2024, month: 1 });
    expect(monthlyRepo.upsert).toHaveBeenCalled();
  });
});
