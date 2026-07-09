import { useLocale } from '../i18n';
import { StatusBadge } from '../components/StatusBadge';
import { formatMoney } from '../utils/format';
import { Icon } from '../components/Icon';

export interface ProductCardProps {
  name: string;
  sku: string;
  price: number;
  stockLabel: string;
  status?: string;
  nameAr?: string;
  nameEn?: string;
}

export function ProductCard({
  name,
  sku,
  price,
  stockLabel,
  status = 'active',
  nameAr,
  nameEn,
}: ProductCardProps) {
  const { locale } = useLocale();
  const primaryName = nameAr && nameEn ? `${nameAr} / ${nameEn}` : name;
  const lowStock = stockLabel.toLowerCase().includes('low');

  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{primaryName}</div>
          <div className="sku" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
            {sku}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="row-between" style={{ marginTop: 'var(--space-4)' }}>
        <div className="num" style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
          {formatMoney(price, locale)}
        </div>
        <div
          className="row"
          style={{
            color: lowStock ? 'var(--color-danger)' : 'var(--color-success)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          <Icon name="box" size={16} />
          <span>{stockLabel}</span>
        </div>
      </div>
    </div>
  );
}
