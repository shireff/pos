import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('POST /api/v1/products', () => {
  it('creates a product from the request body', async () => {
    const request = new NextRequest('http://localhost/api/v1/products', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-permissions': 'catalog.create',
      },
      body: JSON.stringify({
        companyId: 'company-1',
        name: 'Coffee Beans',
        description: 'fresh beans',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Coffee Beans');
  });
});
