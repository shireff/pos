import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('POST /api/auth/login', () => {
  it('returns an access token and user payload for valid credentials', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-1',
      },
      body: JSON.stringify({
        email: 'demo@smartretail.local',
        password: 'password123',
        companyId: 'company-demo',
        deviceFingerprint: 'desktop-1',
        deviceType: 'desktop',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.accessToken.split('.')).toHaveLength(3);
    expect(body.data.user.email).toBe('demo@smartretail.local');
  });
});
