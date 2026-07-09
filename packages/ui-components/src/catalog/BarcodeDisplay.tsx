import { useT } from '../i18n';
import { encodeBarcode } from './barcode';

export interface BarcodeDisplayProps {
  value: string;
  /** Show copy / print actions (default true) */
  showActions?: boolean;
  onCopy?: (value: string) => void;
  onPrint?: (value: string) => void;
}

export function BarcodeDisplay({
  value,
  showActions = true,
  onCopy,
  onPrint,
}: BarcodeDisplayProps) {
  const t = useT();
  const { bits, code, valid } = encodeBarcode(value);
  const moduleWidth = 2;
  const height = 72;
  const width = bits.length * moduleWidth;

  const rects: { x: number; w: number }[] = [];
  let x = 0;
  for (const bit of bits) {
    if (bit === '1') rects.push({ x, w: moduleWidth });
    x += moduleWidth;
  }

  const handleCopy = () => {
    if (onCopy) return onCopy(code);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(code);
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          marginBlockEnd: 'var(--space-3)',
        }}
      >
        <span className="section-label" style={{ marginBlockEnd: 0 }}>
          {t('qr.barcode')}
        </span>
        {!valid && (
          <span className="badge badge-warning" title={t('qr.notAvailable')}>
            {t('qr.notAvailable')}
          </span>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', textAlign: 'center' }}>
        {valid && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            role="img"
            aria-label={`${t('qr.barcode')}: ${code}`}
            style={{ maxWidth: 320, margin: '0 auto', display: 'block' }}
          >
            <rect x="0" y="0" width={width} height={height} fill="#fff" />
            {rects.map((r, i) => (
              <rect key={i} x={r.x} y="4" width={r.w} height={height - 12} fill="#0b0f17" />
            ))}
          </svg>
        )}
        <div className="num" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, letterSpacing: '0.15em', marginTop: 'var(--space-2)' }}>
          {code}
        </div>
      </div>

      {showActions && (
        <div className="row" style={{ marginTop: 'var(--space-3)' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {t('common.copy')}
          </button>
          {onPrint && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onPrint(code)}>
              {t('common.print')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
