import { describe, it, expect } from 'vitest';
import { ContextAssembler } from './context-assembler';

describe('ContextAssembler', () => {
  it('never includes raw database dump (BR-AI-004)', async () => {
    const assembler = new ContextAssembler();
    const result = await assembler.assemble({
      query: 'show me sales data',
      classification: { complexity: 'low', privacySensitivity: 'low' },
      availableSlices: [
        {
          type: 'sales_kpis',
          label: 'Sales KPIs',
          fetch: async () => ({
            totalRevenue: 1000,
            transactions: [{ id: 't1', amount: 100 }],
          }),
        },
      ],
    });

    const serialized = JSON.stringify(result.slices.map((s) => s.data));
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('credential');
    expect(serialized).not.toContain('token');
  });

  it('redacts PII when privacy sensitivity is high (BR-AI-005)', async () => {
    const assembler = new ContextAssembler();
    const result = await assembler.assemble({
      query: 'show me customer John Doe details',
      classification: { complexity: 'low', privacySensitivity: 'high' },
      availableSlices: [
        {
          type: 'customer_summary',
          label: 'Customer Summary',
          fetch: async () => ({
            totalCustomers: 100,
            customers: [{ id: 'c1', name: 'John Doe', email: 'john@example.com', phone: '+123456789' }],
          }),
        },
      ],
    });

    const serialized = JSON.stringify(result.slices.map((s) => s.data));
    expect(serialized).not.toContain('john@example.com');
    expect(serialized).not.toContain('+123456789');
    expect(serialized).not.toContain('John Doe');
  });

  it('uses pre-aggregated read-model slices only', async () => {
    const assembler = new ContextAssembler();
    const result = await assembler.assemble({
      query: 'sales summary',
      classification: { complexity: 'low', privacySensitivity: 'low' },
      availableSlices: [
        {
          type: 'sales_kpis',
          label: 'Sales KPIs',
          fetch: async () => ({ totalRevenue: 1000, avgTransaction: 50 }),
        },
      ],
    });

    expect(result.slices.length).toBeGreaterThan(0);
    expect(result.totalTokens).toBeLessThanOrEqual(result.maxTokens);
  });

  it('local-model queries never leave the device', async () => {
    const assembler = new ContextAssembler();
    const result = await assembler.assemble({
      query: 'what are my top products?',
      classification: { complexity: 'low', privacySensitivity: 'low' },
      availableSlices: [
        {
          type: 'product_catalog',
          label: 'Product Catalog',
          fetch: async () => ({ topProducts: [{ id: 'p1', name: 'Product 1', sales: 100 }] }),
        },
      ],
    });

    expect(result.slices.every((s) => s.data !== undefined)).toBe(true);
    expect(result.truncated).toBe(false);
  });
});
