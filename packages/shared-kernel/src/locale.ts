/**
 * Simple client-side locale accessor.
 *
 * The frontend sets the current locale via `setLocale()` once the locale is
 * known (for now both apps start with Arabic). The API clients read it to
 * send an `Accept-Language` header with every request.
 *
 * This keeps the API client decoupled from React while still allowing the
 * locale to flow from the UI layer into HTTP calls.
 */

let currentLocale: 'ar' | 'en' = 'ar';

export function getLocale(): 'ar' | 'en' {
  return currentLocale;
}

export function setLocale(locale: 'ar' | 'en'): void {
  currentLocale = locale;
}
