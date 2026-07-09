/* Locale-aware formatting helpers (Arabic-first). */
export function formatNumber(value: number, locale: 'ar' | 'en' = 'ar'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoney(value: number, locale: 'ar' | 'en' = 'ar', currency = 'EGP'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | Date, locale: 'ar' | 'en' = 'ar'): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en', {
    dateStyle: 'medium',
  }).format(d);
}
