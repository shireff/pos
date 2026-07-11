import type { TenderType } from '@packages/domain-sales';

export interface SplitPaymentRowProps {
  tenderType: TenderType;
  amountPiasters: number;
  onChange: (amountPiasters: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function SplitPaymentRow({
  tenderType,
  amountPiasters,
  onChange,
  onRemove,
  disabled = false,
}: SplitPaymentRowProps): React.ReactElement {
  return (
    <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
      <span style={{ width: 130 }} className="section-label">{tenderType.replace('_', ' ')}</span>
      <input
        className="form-input num"
        type="number"
        step="0.01"
        defaultValue={(amountPiasters / 100).toFixed(2)}
        onBlur={(e) => {
          const val = Math.round(Number(e.target.value) * 100);
          if (Number.isFinite(val) && val >= 0) {
            onChange(val);
          }
        }}
        disabled={disabled}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={onRemove}
        disabled={disabled}
      >
        ✕
      </button>
    </div>
  );
}
