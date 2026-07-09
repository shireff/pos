import { useT } from '../i18n';
import { Icon } from '../components/Icon';

export interface BreadcrumbSegment {
  id: string;
  name: { ar: string; en?: string };
}

export interface CategoryBreadcrumbProps {
  segments: BreadcrumbSegment[];
  onNavigate?: (id: string) => void;
  /** @deprecated kept for backward compatibility; locale is now provided by LocaleProvider */
  locale?: 'ar' | 'en';
}

export function CategoryBreadcrumb({ segments, onNavigate }: CategoryBreadcrumbProps): JSX.Element {
  const t = useT();
  return (
    <nav aria-label={t('categories.title')}>
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-1)',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          fontSize: 'var(--font-size-sm)',
        }}
      >
        {segments.map((segment, index) => {
          const label = segment.name.ar;
          const isLast = index === segments.length - 1;
          return (
            <li key={segment.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              {index > 0 && (
                <span aria-hidden="true" style={{ color: 'var(--color-text-tertiary)' }}>
                  <Icon name="chevron-left" size={14} />
                </span>
              )}
              {isLast ? (
                <span aria-current="page" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate?.(segment.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px var(--space-2)' }}
                >
                  {label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
