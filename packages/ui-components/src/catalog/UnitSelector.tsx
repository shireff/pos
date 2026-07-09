export interface UnitOption {
  id: string;
  label: string;
  conversionLabel?: string;
}

export interface UnitSelectorProps {
  units: UnitOption[];
  selectedUnit: string;
  onSelect: (unit: string) => void;
}

export function UnitSelector({ units, selectedUnit, onSelect }: UnitSelectorProps) {
  return (
    <div className="row" style={{ gap: 'var(--space-2)' }}>
      {units.map((unit) => (
        <button
          key={unit.id}
          type="button"
          className={`chip${selectedUnit === unit.id ? ' is-selected is-interactive' : ' is-interactive'}`}
          aria-pressed={selectedUnit === unit.id}
          onClick={() => onSelect(unit.id)}
        >
          <span style={{ fontWeight: 600 }}>{unit.label}</span>
          {unit.conversionLabel ? (
            <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8 }}>{unit.conversionLabel}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
