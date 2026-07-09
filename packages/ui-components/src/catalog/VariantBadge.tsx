export interface VariantBadgeProps {
  label: string;
  selected?: boolean;
  attributes?: string[];
}

export function VariantBadge({ label, selected = false, attributes = [] }: VariantBadgeProps) {
  return (
    <span className={`chip${selected ? ' is-selected' : ''}`}>
      {label}
      {attributes.length > 0 ? <span style={{ opacity: 0.75 }}>• {attributes.join('، ')}</span> : null}
    </span>
  );
}
