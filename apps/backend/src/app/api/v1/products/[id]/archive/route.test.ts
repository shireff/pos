import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

describe('PATCH /api/v1/products/:id/archive', () => {
  it('archives the product', async () => {
    const request = new NextRequest('http://localhost/api/v1/products/product-1/archive', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-user-permissions': 'catalog.delete',
      },
      body: JSON.stringify({}),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'product-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isDeleted).toBe(true);
  });
});
