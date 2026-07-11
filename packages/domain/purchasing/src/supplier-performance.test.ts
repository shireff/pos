import { describe, it, expect } from 'vitest';
import { SupplierPerformanceService } from './domain-services/supplier-performance.service';

describe('SupplierPerformanceService', () => {
  describe('computeOnTimeDeliveryRate', () => {
    it('returns zeros for empty receipts', () => {
      const result = SupplierPerformanceService.computeOnTimeDeliveryRate([]);
      expect(result).toEqual({ onTimeCount: 0, totalCount: 0, rate: 0 });
    });

    it('computes 100% when all receipts are on time', () => {
      const receipts = [
        { receivedDate: '2026-08-01T10:00:00.000Z', expectedDeliveryDate: '2026-08-02T00:00:00.000Z' },
        { receivedDate: '2026-08-02T09:00:00.000Z', expectedDeliveryDate: '2026-08-03T00:00:00.000Z' },
      ];

      const result = SupplierPerformanceService.computeOnTimeDeliveryRate(receipts);
      expect(result.onTimeCount).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.rate).toBe(100);
    });

    it('computes partial rate when some are late', () => {
      const receipts = [
        { receivedDate: '2026-08-01T10:00:00.000Z', expectedDeliveryDate: '2026-08-02T00:00:00.000Z' },
        { receivedDate: '2026-08-03T10:00:00.000Z', expectedDeliveryDate: '2026-08-03T00:00:00.000Z' },
      ];

      const result = SupplierPerformanceService.computeOnTimeDeliveryRate(receipts);
      expect(result.onTimeCount).toBe(1);
      expect(result.totalCount).toBe(2);
      expect(result.rate).toBe(50);
    });
  });

  describe('computePriceVariance', () => {
    it('returns 0 when reference price is 0', () => {
      expect(SupplierPerformanceService.computePriceVariance(100, 0)).toBe(0);
    });

    it('computes positive variance', () => {
      expect(SupplierPerformanceService.computePriceVariance(110, 100)).toBe(10);
    });

    it('computes negative variance', () => {
      expect(SupplierPerformanceService.computePriceVariance(90, 100)).toBe(-10);
    });
  });

  describe('generateNarrativeStub', () => {
    it('returns stub string with deterministic content', () => {
      const narrative = SupplierPerformanceService.generateNarrativeStub(95, 10);
      expect(narrative).toContain('excellent on-time delivery performance');
      expect(narrative).toContain('prices trending higher than reference');
      expect(narrative).toContain('Phase 15');
    });
  });
});
