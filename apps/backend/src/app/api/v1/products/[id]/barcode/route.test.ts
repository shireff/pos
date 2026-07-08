import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('POST /api/v1/products/:id/barcode', () => {
  it('generates a barcode for the product', async () => {
    const request = new NextRequest('http://localhost/api/v1/products/product-1/barcode', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-permissions': 'catalog.barcode.generate',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: 'product-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.barcode).toMatch(/^\d{13}$/);
  });
});
