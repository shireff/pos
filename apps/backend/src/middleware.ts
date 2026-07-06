import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 *
 * Generates a unique `X-Request-Id` header for every incoming request.
 * The request ID is attached to all log lines and included in every response.
 *
 * API.md §6 — Rate Limiting skeleton is also applied here.
 */

// ─── In-memory rate-limit store (per IP) ─────────────────────────────────────
// In production, replace with Redis via ioredis or Upstash.

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 120; // 120 req / min per IP

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(ip, newEntry);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: newEntry.resetAt };
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest): NextResponse {
  const requestId = randomUUID();
  const ip = getClientIp(request);

  // Apply rate limiting only to /api/* routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rl = checkRateLimit(ip);

    const headers = new Headers({
      'X-Request-Id': requestId,
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
    });

    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            requestId,
          },
        },
        { status: 429, headers },
      );
    }

    const response = NextResponse.next({
      request: {
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
          'x-request-id': requestId,
        }),
      },
    });

    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));

    return response;
  }

  // Non-API routes: just attach request ID
  const response = NextResponse.next();
  response.headers.set('X-Request-Id', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
