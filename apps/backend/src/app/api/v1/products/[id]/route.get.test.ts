import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('GET /api/v1/products/:id', () => {
  it('returns the full product detail', async () => {
    const request = new NextRequest('http://localhost/api/v1/products/product-1', {
      headers: {
        'x-user-permissions': 'catalog.view',
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: 'product-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('product-1');
    expect(body.data.name).toBe('Coffee Beans');
  });
});
