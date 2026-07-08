import React, { useState, useMemo } from 'react';
import { UnitConversionBadge } from './UnitConversionBadge';

export interface UnitOption {
  id: string;
  unitName: string;
  conversionFactorToBase: number;
  isBaseUnit: boolean;
}

export interface UnitPickerModalProps {
  units: UnitOption[];
  selectedId?: string;
  onSelect: (unit: UnitOption) => void;
  onClose: () => void;
}

export function UnitPickerModal({
  units,
  selectedId,
  onSelect,
  onClose,
}: UnitPickerModalProps): React.ReactElement {
  const [search, setSearch] = useState('');

  const baseUnit = useMemo(() => units.find((u) => u.isBaseUnit), [units]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? units.filter((u) => u.unitName.toLowerCase().includes(q)) : units;
  }, [units, search]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick unit of measure"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          width: 360,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Select Unit</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: '#555',
            }}
          >
            ×
          </button>
        </div>

        <input
          type="search"
          placeholder="Search units…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search units"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #d0d7de',
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />

        <ul
          role="listbox"
          aria-label="Unit options"
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            overflowY: 'auto',
            flexGrow: 1,
            gap: 4,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {filtered.length === 0 && (
            <li style={{ color: '#888', fontSize: 13, padding: '8px 0' }}>No units found</li>
          )}
          {filtered.map((unit) => (
            <li
              key={unit.id}
              role="option"
              aria-selected={unit.id === selectedId}
              onClick={() => onSelect(unit)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: unit.id === selectedId ? '#eff6ff' : 'transparent',
                border: unit.id === selectedId ? '1px solid #bfdbfe' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: unit.isBaseUnit ? 600 : 400 }}>
                {unit.unitName}
              </span>
              <UnitConversionBadge
                unitName={unit.unitName}
                conversionFactorToBase={unit.conversionFactorToBase}
                baseUnitName={baseUnit?.unitName ?? unit.unitName}
                isBaseUnit={unit.isBaseUnit}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
