import { useState } from 'react';
import { useT } from '../i18n';
import { Icon } from '../components/Icon';
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

export function UnitPickerModal({ units, selectedId, onSelect, onClose }: UnitPickerModalProps): JSX.Element {
  const t = useT();
  const baseUnit = units.find((u) => u.isBaseUnit);
  const [search, setSearch] = useState('');

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('catalog.units')} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{t('catalog.units')}</h2>
          <button type="button" className="modal-close" aria-label={t('common.close')} onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="search-bar" style={{ marginBlockEnd: 'var(--space-4)' }}>
            <span className="search-bar__icon"><Icon name="search" size={18} /></span>
            <input
              className="search-input"
              type="search"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('common.search')}
            />
          </div>
          <ul role="listbox" aria-label={t('catalog.units')} className="stack" style={{ gap: 'var(--space-2)' }}>
            {units
              .filter((u) => !search.trim() || u.unitName.toLowerCase().includes(search.trim().toLowerCase()))
              .map((unit) => (
                <li
                  key={unit.id}
                  role="option"
                  aria-selected={unit.id === selectedId}
                  className="row-between"
                  onClick={() => onSelect(unit)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: unit.id === selectedId ? 'var(--color-primary-soft)' : 'var(--color-bg-surface)',
                    border: unit.id === selectedId ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ fontWeight: unit.isBaseUnit ? 600 : 400 }}>{unit.unitName}</span>
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
    </div>
  );
}
