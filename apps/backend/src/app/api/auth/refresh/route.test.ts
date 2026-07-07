import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createRefreshRouteHandler } from './store';

let handler = createRefreshRouteHandler(new Set<string>());

beforeEach(() => {
  handler = createRefreshRouteHandler(new Set<string>());
});

describe('POST /api/auth/refresh', () => {
  it('returns a new access token for a valid refresh token', async () => {
    const request = new NextRequest('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-2',
      },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    const response = await handler(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTruthy();
  });

  it('rejects a replayed refresh token after it has already been used', async () => {
    const firstRequest = new NextRequest('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-3',
      },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    const firstResponse = await handler(firstRequest);
    expect(firstResponse.status).toBe(200);

    const secondRequest = new NextRequest('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-4',
      },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    const secondResponse = await handler(secondRequest);
    const secondBody = await secondResponse.json();

    expect(secondResponse.status).toBe(401);
    expect(secondBody.success).toBe(false);
    expect(secondBody.error.code).toBe('UNAUTHORIZED');
  });
});
