import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as logout } from './route';
import { createRefreshRouteHandler, resetRefreshTokenStore } from '../refresh/store';

const refreshHandler = createRefreshRouteHandler();

beforeEach(() => {
  resetRefreshTokenStore();
});

describe('POST /api/auth/logout', () => {
  it('revokes a refresh token so it can no longer be used', async () => {
    const logoutRequest = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-logout' },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    const logoutResponse = await logout(logoutRequest);
    expect(logoutResponse.status).toBe(200);

    const refreshRequest = new NextRequest('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-refresh' },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    const refreshResponse = await refreshHandler(refreshRequest);
    expect(refreshResponse.status).toBe(401);
  });
});
