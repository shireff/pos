import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('POST /api/v1/products/:id/variants', () => {
  it('adds a variant to the product', async () => {
    const request = new NextRequest('http://localhost/api/v1/products/product-1/variants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-permissions': 'catalog.create',
      },
      body: JSON.stringify({
        sku: 'VAR-001',
        barcode: '1234567890128',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: 'product-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.sku).toBe('VAR-001');
  });
});
