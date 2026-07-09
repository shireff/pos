/**
 * Translates API error codes into user-facing messages.
 *
 * The backend always returns a machine-readable `code` field alongside the
 * English `message`. Use the code (not the message string) to look up the
 * correct localised text so the UI stays language-consistent regardless of
 * what language the server uses internally.
 *
 * To add a new code: add it to `API_ERROR_MESSAGES` with both `en` and `ar`.
 */

export type SupportedLocale = 'en' | 'ar';

interface ErrorMessages {
    en: string;
    ar: string;
}

const API_ERROR_MESSAGES: Record<string, ErrorMessages> = {
    UNAUTHORIZED: {
        en: 'Invalid email or password.',
        ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    },
    FORBIDDEN: {
        en: 'You do not have permission to perform this action.',
        ar: 'ليس لديك صلاحية لتنفيذ هذه العملية.',
    },
    VALIDATION_ERROR: {
        en: 'The submitted data is invalid. Please check your input.',
        ar: 'البيانات المُرسَلة غير صالحة. يرجى مراجعة المدخلات.',
    },
    NOT_FOUND: {
        en: 'The requested resource was not found.',
        ar: 'العنصر المطلوب غير موجود.',
    },
    INTERNAL_SERVER_ERROR: {
        en: 'An unexpected error occurred. Please try again later.',
        ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.',
    },
    MFA_REQUIRED: {
        en: 'Multi-factor authentication is required.',
        ar: 'المصادقة الثنائية مطلوبة.',
    },
    MFA_INVALID: {
        en: 'The authentication code is incorrect or has expired.',
        ar: 'رمز المصادقة غير صحيح أو منتهي الصلاحية.',
    },
    ACCOUNT_LOCKED: {
        en: 'This account has been temporarily locked. Please try again later.',
        ar: 'تم تأمين هذا الحساب مؤقتاً. يرجى المحاولة مرة أخرى لاحقاً.',
    },
    ACCOUNT_INACTIVE: {
        en: 'This account is inactive. Please contact your administrator.',
        ar: 'هذا الحساب غير نشط. يرجى التواصل مع المسؤول.',
    },
    CONFLICT: {
        en: 'This record already exists.',
        ar: 'هذا السجل موجود مسبقاً.',
    },
    NETWORK_ERROR: {
        en: 'Unable to connect to the server. Check your internet connection.',
        ar: 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
    },
};

/**
 * Returns a localised error message for a given API error code.
 *
 * Falls back to the raw `fallbackMessage` (usually the English server message)
 * if the code is unknown, so new unhandled codes still display something
 * meaningful rather than a blank or generic string.
 *
 * @example
 * const msg = getApiErrorMessage('UNAUTHORIZED', 'en');
 * // → 'Invalid email or password.'
 */
export function getApiErrorMessage(
    code: string | undefined,
    locale: SupportedLocale,
    fallbackMessage?: string,
): string {
    if (code && API_ERROR_MESSAGES[code]) {
        return API_ERROR_MESSAGES[code][locale];
    }
    return fallbackMessage ?? API_ERROR_MESSAGES.INTERNAL_SERVER_ERROR[locale];
}
