import { NextRequest, NextResponse } from 'next/server';
import { t, type Vars } from './i18n';

/**
 * Global Error Handler Utility
 *
 * Maps DomainError subclasses → standard API envelope (API.md §3).
 * All Route Handlers should call this in their catch blocks.
 *
 * Standard error envelope:
 * {
 *   success: false,
 *   error: {
 *     code: string,       // machine-readable error code (unchanged)
 *     message: string,    // human-readable, localized message
 *     requestId: string,  // propagated from X-Request-Id header
 *     details?: unknown,  // optional extra context (dev only)
 *   }
 * }
 *
 * Error codes are language-independent (NOT_FOUND, VALIDATION_ERROR,
 * UNAUTHORIZED, FORBIDDEN, ...) while messages are localized via the i18n
 * module (default locale: Arabic, driven by the Accept-Language header).
 */

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  /** Optional i18n key so handleApiError can re-localize per request locale. */
  public messageKey?: string;
  /** Optional i18n interpolation variables. */
  public messageVars?: Vars;

  public constructor(code: string, message: string, statusCode = 422) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends DomainError {
  public constructor(resource: string, id: string) {
    super('NOT_FOUND', t('errors.notFound', { resource, id }), 404);
    this.name = 'NotFoundError';
    this.messageKey = 'errors.notFound';
    this.messageVars = { resource, id };
  }
}

export class ValidationError extends DomainError {
  public constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends DomainError {
  public constructor(message = t('auth.unauthorized')) {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
    this.messageKey = 'auth.unauthorized';
  }
}

export class ForbiddenError extends DomainError {
  public permissionCode?: string;

  public constructor(permissionCode?: string, message?: string) {
    const localized = message ?? t('errors.permissionDenied', { permission: permissionCode ?? '' });
    super('FORBIDDEN', localized, 403);
    this.name = 'ForbiddenError';
    this.permissionCode = permissionCode;
    if (!message) {
      this.messageKey = 'errors.permissionDenied';
      this.messageVars = { permission: permissionCode ?? '' };
    }
  }
}

/**
 * Maps an unknown error to a standard API error response.
 */
export function handleApiError(error: unknown, request: NextRequest): NextResponse {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const isDev = process.env.NODE_ENV === 'development';

  if (error instanceof DomainError) {
    // Re-localize using the request's Accept-Language (default: Arabic),
    // keeping the original message as fallback when no key is available.
    const message = error.messageKey
      ? t(error.messageKey, error.messageVars, request)
      : error.message;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message,
          requestId,
          ...(error instanceof ForbiddenError && error.permissionCode
            ? { permissionCode: error.permissionCode }
            : {}),
          ...(isDev ? { stack: error.stack } : {}),
        },
      },
      { status: error.statusCode, headers: { 'X-Request-Id': requestId } },
    );
  }

  // Unknown / unexpected errors — never expose internals in production
  const genericMessage =
    isDev && error instanceof Error
      ? error.message
      : t('errors.unexpected', undefined, request);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: genericMessage,
        requestId,
      },
    },
    { status: 500, headers: { 'X-Request-Id': requestId } },
  );
}
