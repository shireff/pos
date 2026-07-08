import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('GET /api/v1/products', () => {
  it('returns a paginated product list with filters and sorting', async () => {
    const request = new NextRequest(
      'http://localhost/api/v1/products?status=active&search=coffee&sortBy=name&limit=2&offset=0',
      {
        headers: {
          'x-user-permissions': 'catalog.view',
        },
      },
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: expect.stringMatching(/coffee/i) })]),
    );
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });
});
