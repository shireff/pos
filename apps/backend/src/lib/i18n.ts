/* =========================================================================
 * Backend Internationalization (i18n)
 *
 * Arabic-first (default, matching the frontend). Centralized, machine-readable
 * error codes stay unchanged (NOT_FOUND, VALIDATION_ERROR, UNAUTHORIZED, ...)
 * while the human-readable messages are localized.
 *
 * Usage:
 *   import { t, getLocaleFromRequest } from '../../../lib/i18n';
 *
 *   // Default locale ('ar')
 *   t('common.required');
 *
 *   // Request-aware (reads Accept-Language, defaults to 'ar')
 *   t('auth.invalidToken', undefined, request);
 *
 *   // With interpolation variables
 *   t('errors.notFound', { resource: 'Order', id: 'abc' }, request);
 *
 * Pattern deliberately mirrors the frontend i18n (common.*, auth.*, ...).
 * ========================================================================= */

import type { NextRequest } from 'next/server';

export type Locale = 'ar' | 'en';

export type Dict = Record<string, string>;

export const ARABIC_LOCALE: Locale = 'ar';
export const DEFAULT_LOCALE: Locale = 'ar';

// ─── Dictionaries ───────────────────────────────────────────────────────────

const ar: Dict = {
  // Generic / common
  'common.required': 'مطلوب',
  'common.error': 'خطأ',
  'common.unexpectedError': 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.',
  'common.tooManyRequests': 'طلبات كثيرة جداً. يرجى المحاولة لاحقاً.',

  // Errors (response-level)
  'errors.notFound': 'لم يتم العثور على {resource} بالمعرّف "{id}".',
  'errors.unexpected': 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.',
  'errors.invalidRequest': 'طلب غير صالح: {message}',
  'errors.permissionDenied': 'تم رفض الإذن. المطلوب: {permission}',
  'errors.validation': 'فشل التحقق من صحة البيانات.',

  // Auth
  'auth.unauthorized': 'المصادقة مطلوبة.',
  'auth.missingToken': 'رمز الحامل (Bearer) مفقود.',
  'auth.invalidToken': 'رمز الوصول غير صالح.',
  'auth.invalidCredentials': 'بيانات الاعتماد غير صحيحة.',
  'auth.invalidEmailPassword': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth.invalidRefreshToken': 'رمز التحديث غير صالح.',
  'auth.refreshTokenUsed': 'تم استخدام رمز التحديث مسبقاً.',
  'auth.refreshTokenRequired': 'رمز التحديث مطلوب.',
  'auth.missingContext': 'سياق المصادقة مفقود.',
  'auth.expiredToken': 'رمز غير صالح أو منتهي الصلاحية.',
  'auth.platformTokenRejected': 'PLATFORM_ADMIN_TOKEN_REJECTED',
  'auth.platformTokenPayloadInvalid': 'حمولة رمز مدير النظام غير صالحة.',
  'auth.tokenFormatInvalid': 'صيغة الرمز غير صالحة.',
  'auth.tokenPayloadInvalid': 'حمولة الرمز غير صالحة.',
  'auth.authorizationBearerRequired': 'ترويسة التخويل (Authorization) مع رمز Bearer مطلوبة.',

  // Validation
  'validation.required': 'هذا الحقل مطلوب.',
  'validation.email': 'بريد إلكتروني غير صالح.',
  'validation.minLength': 'يجب ألا يقل عن {count} حرفاً.',
  'validation.maxLength': 'يجب ألا يزيد عن {count} حرفاً.',
  'validation.min': 'يجب ألا يقل عن {count}.',
  'validation.max': 'يجب ألا يزيد عن {count}.',
  'validation.minItems': 'يجب توفير عنصر واحد على الأقل.',
  'validation.maxItems': 'يجب ألا يتجاوز العدد {count} عناصر.',
  'validation.invalidFormat': 'صيغة غير صالحة.',
  'validation.currencyLength': 'يجب أن يكون الرمز مكوناً من {count} حرفاً بالضبط.',
  'validation.numeric': 'يجب أن يكون رقماً.',
  'validation.positive': 'يجب أن تكون القيمة موجبة.',
  'validation.nonNegative': 'يجب ألا تكون القيمة سالبة.',
  'validation.integer': 'يجب أن يكون عدداً صحيحاً.',
  'validation.confirm': 'القيم غير متطابقة.',
  'validation.nameRequired': 'الاسم مطلوب.',
  'validation.phoneRequired': 'رقم الهاتف مطلوب.',
  'validation.arabicNameRequired': 'الاسم العربي مطلوب.',
  'validation.amountPositive': 'يجب أن يكون المبلغ موجباً.',
  'validation.reasonRequired': 'السبب مطلوب.',
  'validation.paymentMethodRequired': 'طريقة الدفع مطلوبة.',
  'validation.creditLimitNonNegative': 'يجب ألا يكون حد الائتمان سالباً.',
  'validation.pointsPositive': 'يجب أن تكون النقاط عدداً صحيحاً موجباً.',
  'validation.invalidUuid': 'يجب أن يكون {field} معرّفاً فريداً (UUID) صالحاً.',
  'validation.planIdRequired': 'planId مطلوب.',
  'validation.planIdInvalid': 'planId يجب أن يكون أحد القيم: basic, pro, enterprise',
  'validation.companyIdRequired': 'companyId مطلوب.',
  'validation.companyNotFound': 'الشركة ذات المعرّف "{id}" غير موجودة.',
  'validation.fileReferenceRequired': 'fileReference مطلوب.',
  'validation.pinRequired': 'pin مطلوب.',
  'validation.credentialsRequired':
    'email, password, companyId, deviceFingerprint, وdeviceType مطلوبة.',
  'validation.atLeastOneField': 'يجب توفير حقل واحد على الأقل للتحديث.',
  'validation.sourceTargetDiffer': 'يجب أن يختلف العميلان المصدر والهدف.',
};

const en: Dict = {
  // Generic / common
  'common.required': 'Required',
  'common.error': 'Error',
  'common.unexpectedError': 'An unexpected error occurred. Please try again later.',
  'common.tooManyRequests': 'Too many requests. Please try again later.',

  // Errors (response-level)
  'errors.notFound': '{resource} with id "{id}" was not found.',
  'errors.unexpected': 'An unexpected error occurred. Please try again later.',
  'errors.invalidRequest': 'Invalid request: {message}',
  'errors.permissionDenied': 'Permission denied. Required: {permission}',
  'errors.validation': 'Validation failed.',

  // Auth
  'auth.unauthorized': 'Authentication required.',
  'auth.missingToken': 'Missing bearer token',
  'auth.invalidToken': 'Invalid access token',
  'auth.invalidCredentials': 'Invalid credentials',
  'auth.invalidEmailPassword': 'Invalid email or password',
  'auth.invalidRefreshToken': 'Invalid refresh token',
  'auth.refreshTokenUsed': 'Refresh token has already been used',
  'auth.refreshTokenRequired': 'refreshToken is required',
  'auth.missingContext': 'Missing authentication context',
  'auth.expiredToken': 'Invalid or expired token',
  'auth.platformTokenRejected': 'PLATFORM_ADMIN_TOKEN_REJECTED',
  'auth.platformTokenPayloadInvalid': 'Invalid platform admin token payload',
  'auth.tokenFormatInvalid': 'Invalid token format',
  'auth.tokenPayloadInvalid': 'Invalid token payload',
  'auth.authorizationBearerRequired': 'Authorization header with Bearer token is required',

  // Validation
  'validation.required': 'This field is required.',
  'validation.email': 'Invalid email address.',
  'validation.minLength': 'Must be at least {count} characters.',
  'validation.maxLength': 'Must be at most {count} characters.',
  'validation.min': 'Must be at least {count}.',
  'validation.max': 'Must be at most {count}.',
  'validation.minItems': 'At least one item is required.',
  'validation.maxItems': 'Must not exceed {count} items.',
  'validation.invalidFormat': 'Invalid format.',
  'validation.currencyLength': 'Currency must be exactly {count} characters.',
  'validation.numeric': 'Must be a number.',
  'validation.positive': 'Must be a positive value.',
  'validation.nonNegative': 'Must not be negative.',
  'validation.integer': 'Must be an integer.',
  'validation.confirm': 'Values do not match.',
  'validation.nameRequired': 'Name is required',
  'validation.phoneRequired': 'Phone is required',
  'validation.arabicNameRequired': 'Arabic name is required',
  'validation.amountPositive': 'Amount must be positive',
  'validation.reasonRequired': 'Reason is required',
  'validation.paymentMethodRequired': 'Payment method is required',
  'validation.creditLimitNonNegative': 'Credit limit must be non-negative',
  'validation.pointsPositive': 'Points must be a positive integer',
  'validation.invalidUuid': '{field} must be a valid UUID',
  'validation.planIdRequired': 'planId is required',
  'validation.planIdInvalid': 'planId must be one of: basic, pro, enterprise',
  'validation.companyIdRequired': 'companyId is required',
  'validation.companyNotFound': 'Company with ID "{id}" not found',
  'validation.fileReferenceRequired': 'fileReference is required',
  'validation.pinRequired': 'pin is required',
  'validation.credentialsRequired':
    'email, password, companyId, deviceFingerprint, and deviceType are required',
  'validation.atLeastOneField': 'At least one field must be provided for update',
  'validation.sourceTargetDiffer': 'Source and target customers must differ',
};

const dictionaries: Record<Locale, Dict> = { ar, en };

// ─── Locale resolution ──────────────────────────────────────────────────────

/**
 * Parses an Accept-Language header and returns the best matching supported
 * locale. Falls back to Arabic (the default) when absent or unsupported.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  let best: Locale = DEFAULT_LOCALE;
  let bestQ = -1;

  for (const part of header.split(',')) {
    const [tag, ...params] = part.split(';');
    const lang = tag.trim().split('-')[0].toLowerCase();
    if (lang !== 'ar' && lang !== 'en') continue;

    let q = 1;
    for (const p of params) {
      const match = p.trim().match(/^q=([\d.]+)$/i);
      if (match) q = Number.parseFloat(match[1]);
    }

    if (q > bestQ) {
      bestQ = q;
      best = lang as Locale;
    }
  }

  return best;
}

/**
 * Resolves a locale from either an explicit locale string or a NextRequest
 * (reading its Accept-Language header). Defaults to Arabic when ambiguous.
 */
export function resolveLocale(input?: NextRequest | Locale | null): Locale {
  if (input === 'ar' || input === 'en') return input;
  if (input && typeof (input as NextRequest).headers?.get === 'function') {
    return parseAcceptLanguage((input as NextRequest).headers.get('accept-language'));
  }
  return DEFAULT_LOCALE;
}

/** Convenience helper reading the locale from a request. */
export function getLocaleFromRequest(request: NextRequest): Locale {
  return parseAcceptLanguage(request.headers.get('accept-language'));
}

/**
 * Returns a translation bound to a specific locale/request. Useful when a
 * single locale is reused across many messages (e.g. inside a route handler).
 */
export function createT(localeOrRequest: NextRequest | Locale): (key: string, vars?: Vars) => string {
  const locale = resolveLocale(localeOrRequest);
  return (key: string, vars?: Vars) => t(key, vars, locale);
}

// ─── Translate ──────────────────────────────────────────────────────────────

export type Vars = Record<string, string | number>;

/**
 * Translates a key for the given locale (or request). When no locale/request is
 * provided, Arabic (the default) is used. Unknown keys fall back to Arabic, then
 * to the raw key string (so callers always get a non-empty message).
 */
export function t(key: string, vars?: Vars, localeOrRequest?: NextRequest | Locale): string {
  const locale = resolveLocale(localeOrRequest);
  let str: string = dictionaries[locale]?.[key] ?? dictionaries.ar[key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return str;
}
