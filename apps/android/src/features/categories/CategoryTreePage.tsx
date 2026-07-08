import React, { useState } from 'react';
import { CategoryTreeNodeData, UnitPickerModal, UnitOption } from '@packages/ui-components';

const seedTree: CategoryTreeNodeData[] = [
  {
    id: 'cat-1',
    name: { ar: 'المشروبات', en: 'Beverages' },
    parentId: null,
    sortOrder: 0,
    level: 0,
    path: 'cat-1',
    isDeleted: false,
    children: [
      {
        id: 'cat-1-1',
        name: { ar: 'مشروبات ساخنة', en: 'Hot Drinks' },
        parentId: 'cat-1',
        sortOrder: 0,
        level: 1,
        path: 'cat-1/cat-1-1',
        isDeleted: false,
        children: [],
      },
      {
        id: 'cat-1-2',
        name: { ar: 'مشروبات باردة', en: 'Cold Drinks' },
        parentId: 'cat-1',
        sortOrder: 1,
        level: 1,
        path: 'cat-1/cat-1-2',
        isDeleted: false,
        children: [],
      },
    ],
  },
  {
    id: 'cat-2',
    name: { ar: 'المواد الغذائية', en: 'Food' },
    parentId: null,
    sortOrder: 1,
    level: 0,
    path: 'cat-2',
    isDeleted: false,
    children: [],
  },
];

const demoUnits: UnitOption[] = [
  { id: 'unit-1', unitName: 'قطعة', conversionFactorToBase: 1, isBaseUnit: true },
  { id: 'unit-2', unitName: 'علبة', conversionFactorToBase: 12, isBaseUnit: false },
  { id: 'unit-3', unitName: 'كرتون', conversionFactorToBase: 24, isBaseUnit: false },
];

function AccordionItem({
  node,
  depth = 0,
  onSelect,
  selectedId,
}: {
  node: CategoryTreeNodeData;
  depth?: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) setOpen((p) => !p);
          onSelect(node.id);
        }}
        aria-expanded={hasChildren ? open : undefined}
        style={{
          width: '100%',
          textAlign: 'start',
          background: isSelected ? '#eff6ff' : 'transparent',
          border: 'none',
          borderBottom: '1px solid #f0f0f0',
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 15,
          color: node.isDeleted ? '#aaa' : '#24292f',
          opacity: node.isDeleted ? 0.5 : 1,
        }}
      >
        {hasChildren ? (
          <span aria-hidden="true" style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>
            {open ? '▾' : '▸'}
          </span>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}
        <span style={{ flexGrow: 1 }}>
          {node.name.ar}
          {node.name.en && (
            <span style={{ color: '#888', fontSize: 13, marginInlineStart: 6 }}>
              ({node.name.en})
            </span>
          )}
        </span>
        {isSelected && <span style={{ color: '#0969da', fontSize: 18 }}>✓</span>}
      </button>
      {hasChildren &&
        open &&
        node.children.map((child) => (
          <AccordionItem
            key={child.id}
            node={child}
            depth={depth + 1}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
    </div>
  );
}

export function CategoryTreePage(): React.ReactElement {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const selectedUnit = demoUnits.find((u) => u.id === selectedUnitId);

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f6f8fa' }}>
      <div
        style={{
          background: '#fff',
          padding: '16px 20px',
          borderBottom: '1px solid #d0d7de',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>Categories</div>
        <div style={{ fontSize: 13, color: '#57606a' }}>Tap to select</div>
      </div>

      <div style={{ background: '#fff', margin: '12px 0' }}>
        {seedTree
          .filter((n) => !n.isDeleted)
          .map((node) => (
            <AccordionItem
              key={node.id}
              node={node}
              onSelect={setSelectedCategoryId}
              selectedId={selectedCategoryId}
            />
          ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <button
          type="button"
          onClick={() => setShowUnitPicker(true)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: '#fff',
            border: '1px solid #d0d7de',
            borderRadius: 12,
            fontSize: 15,
            textAlign: 'start',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: selectedUnit ? '#24292f' : '#888' }}>
            {selectedUnit ? `Unit: ${selectedUnit.unitName}` : 'Select unit of measure…'}
          </span>
          <span style={{ color: '#888' }}>›</span>
        </button>
      </div>

      {showUnitPicker && (
        <UnitPickerModal
          units={demoUnits}
          selectedId={selectedUnitId ?? undefined}
          onSelect={(unit) => {
            setSelectedUnitId(unit.id);
            setShowUnitPicker(false);
          }}
          onClose={() => setShowUnitPicker(false)}
        />
      )}
    </div>
  );
}
