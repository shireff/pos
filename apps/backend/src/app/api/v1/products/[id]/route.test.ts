import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

describe('PATCH /api/v1/products/:id', () => {
  it('updates a product from the request body', async () => {
    const request = new NextRequest('http://localhost/api/v1/products/product-1', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-user-permissions': 'catalog.edit',
      },
      body: JSON.stringify({
        name: 'Coffee Beans Premium',
        description: 'premium beans',
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'product-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Coffee Beans Premium');
    expect(body.data.description).toBe('premium beans');
  });
});
