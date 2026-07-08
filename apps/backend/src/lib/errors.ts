import { NextRequest, NextResponse } from 'next/server';

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
 *     code: string,       // machine-readable error code
 *     message: string,    // human-readable message
 *     requestId: string,  // propagated from X-Request-Id header
 *     details?: unknown,  // optional extra context (dev only)
 *   }
 * }
 */

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(code: string, message: string, statusCode = 422) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends DomainError {
  public constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id "${id}" was not found.`, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  public constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends DomainError {
  public constructor(message = 'Authentication required.') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  public permissionCode?: string;

  public constructor(message = 'You do not have permission to perform this action.') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Maps an unknown error to a standard API error response.
 */
export function handleApiError(error: unknown, request: NextRequest): NextResponse {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const isDev = process.env.NODE_ENV === 'development';

  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
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
      : 'An unexpected error occurred. Please try again later.';

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
