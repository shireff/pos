import React from 'react';

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
}: UnitConversionBadgeProps): React.ReactElement {
  return (
    <span
      title={
        isBaseUnit
          ? `${unitName} is the base unit`
          : `1 ${unitName} = ${conversionFactorToBase} ${baseUnitName}`
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 500,
        color: isBaseUnit ? '#166534' : '#1e40af',
        background: isBaseUnit ? '#dcfce7' : '#dbeafe',
        border: `1px solid ${isBaseUnit ? '#bbf7d0' : '#bfdbfe'}`,
        borderRadius: 999,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {isBaseUnit ? (
        <>
          <span aria-hidden="true">★</span>
          {unitName}
        </>
      ) : (
        <>
          1 {unitName} = {conversionFactorToBase} {baseUnitName}
        </>
      )}
    </span>
  );
}
