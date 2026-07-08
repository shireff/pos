import React from 'react';

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
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {units.map((unit) => (
        <button
          key={unit.id}
          type="button"
          onClick={() => onSelect(unit.id)}
          style={{
            borderRadius: 999,
            border: selectedUnit === unit.id ? '1px solid #0969da' : '1px solid #d0d7de',
            background: selectedUnit === unit.id ? '#eaf4ff' : '#fff',
            color: selectedUnit === unit.id ? '#0969da' : '#24292f',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontWeight: 600 }}>{unit.label}</div>
          {unit.conversionLabel ? (
            <div style={{ fontSize: 11, opacity: 0.8 }}>{unit.conversionLabel}</div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
