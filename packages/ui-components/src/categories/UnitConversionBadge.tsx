import { useT } from '../i18n';

export interface UnitConversionBadgeProps {
  unitName: string;
  conversionFactorToBase: number;
  baseUnitName: string;
  isBaseUnit?: boolean;
}

export function UnitConversionBadge({
  unitName,
  conversionFactorToBase,
  baseUnitName,
  isBaseUnit = false,
}: UnitConversionBadgeProps) {
  const t = useT();
  const title = isBaseUnit
    ? `${unitName} — ${t('units.baseUnit')}`
    : `1 ${unitName} = ${conversionFactorToBase} ${baseUnitName}`;

  return (
    <span
      className="badge badge-draft"
      title={title}
      style={{ background: isBaseUnit ? 'var(--color-success-soft)' : 'var(--color-info-soft)', color: isBaseUnit ? 'var(--color-success-on)' : 'var(--color-info-on)' }}
    >
      {isBaseUnit ? <span aria-hidden="true">★</span> : null}
      {isBaseUnit ? unitName : `1 ${unitName} = ${conversionFactorToBase} ${baseUnitName}`}
    </span>
  );
}
