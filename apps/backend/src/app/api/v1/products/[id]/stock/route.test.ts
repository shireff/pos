import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('GET /api/v1/products/:id/stock', () => {
  it('returns stock levels by warehouse', async () => {
    const request = new NextRequest('http://localhost/api/v1/products/product-1/stock');

    const response = await GET(request, {
      params: Promise.resolve({ id: 'product-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.items[0].warehouseId).toBe('main');
  });
});
