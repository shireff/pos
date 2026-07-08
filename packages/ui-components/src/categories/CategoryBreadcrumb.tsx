import React from 'react';

export interface BreadcrumbSegment {
  id: string;
  name: { ar: string; en?: string };
}

export interface CategoryBreadcrumbProps {
  segments: BreadcrumbSegment[];
  onNavigate?: (id: string) => void;
  locale?: 'ar' | 'en';
}

export function CategoryBreadcrumb({
  segments,
  onNavigate,
  locale = 'ar',
}: CategoryBreadcrumbProps): React.ReactElement {
  return (
    <nav aria-label="Category breadcrumb">
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
          listStyle: 'none',
          margin: 0,
          padding: 0,
          fontSize: 13,
          color: '#57606a',
        }}
      >
        {segments.map((segment, index) => {
          const label = locale === 'en' && segment.name.en ? segment.name.en : segment.name.ar;
          const isLast = index === segments.length - 1;

          return (
            <li key={segment.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {index > 0 && (
                <span aria-hidden="true" style={{ color: '#d0d7de', userSelect: 'none' }}>
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" style={{ color: '#24292f', fontWeight: 600 }}>
                  {label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate?.(segment.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#0969da',
                    fontSize: 13,
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
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
