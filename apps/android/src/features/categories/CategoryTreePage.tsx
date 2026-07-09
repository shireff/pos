import { useEffect, useMemo, useState } from 'react';
import { UnitPickerModal, useT, Icon } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchCategories, fetchUnits, createCategory,
  moveCategory, type Category,
} from '../../lib/store/catalogSlice';

interface TreeNode extends Category {
  children: TreeNode[];
}

function buildTree(flat: Category[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const c of flat) map.set(c.id, { ...c, children: [] });
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function AccordionNode({
  node, depth = 0, selectedId, onSelect,
}: {
  node: TreeNode; depth?: number; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <li className="accordion-item" style={{ paddingInlineStart: depth * 16 }}>
      <button
        type="button"
        className={`accordion-btn${isSelected ? ' selected' : ''}`}
        onClick={() => { if (hasChildren) setOpen((v) => !v); onSelect(node.id); }}
        aria-expanded={hasChildren ? open : undefined}
      >
        {hasChildren ? (
          <span style={{ width: 16, flexShrink: 0, display: 'inline-flex', color: 'var(--color-text-secondary)' }}>
            <Icon name={open ? 'chevron-down' : 'chevron-left'} size={16} />
          </span>
        ) : <span style={{ width: 16, flexShrink: 0 }} />}
        <span style={{ flexGrow: 1, textAlign: 'start' }}>
          {node.name.ar}
          {node.name.en && (
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', marginInlineStart: 6 }}>
              ({node.name.en})
            </span>
          )}
        </span>
        {isSelected && <span style={{ color: 'var(--color-primary)' }} aria-hidden="true"><Icon name="check" size={16} /></span>}
        {!hasChildren && <span style={{ width: 16 }} />}
      </button>
      {hasChildren && open && (
        <ul role="group" style={{ listStyle: 'none', padding: 0 }}>
          {node.children.map((child) => (
            <AccordionNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTreePage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.catalog.categories);
  const units = useAppSelector((s) => s.catalog.units);
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? '');
  const catalogStatus = useAppSelector((s) => s.catalog.status);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [showMovePicker, setShowMovePicker] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const descendantIds = useMemo(() => {
    const result = new Set<string>();
    if (!selectedCategoryId) return result;
    const stack = [selectedCategoryId];
    while (stack.length) {
      const current = stack.pop()!;
      for (const c of categories) {
        if (c.parentId === current) {
          result.add(c.id);
          stack.push(c.id);
        }
      }
    }
    return result;
  }, [selectedCategoryId, categories]);

  const moveTargets = useMemo<{ id: string | null; name: string }[]>(() => {
    if (!selectedCategoryId) return [];
    const targets: { id: string | null; name: string }[] = [
      { id: null, name: t('categories.rootLevel') },
    ];
    for (const c of categories) {
      if (c.id !== selectedCategoryId && !descendantIds.has(c.id)) {
        targets.push({
          id: c.id,
          name: c.name.ar + (c.name.en ? ` (${c.name.en})` : ''),
        });
      }
    }
    return targets;
  }, [selectedCategoryId, categories, descendantIds, t]);

  const handleMove = async (newParentId: string | null) => {
    if (!selectedCategoryId) return;
    setActionError(null);
    try {
      await dispatch(moveCategory({ categoryId: selectedCategoryId, newParentId })).unwrap();
      setShowMovePicker(false);
      void dispatch(fetchCategories({ companyId }));
    } catch (err) {
      setActionError(String(err));
    }
  };

  useEffect(() => {
    if (companyId) {
      void dispatch(fetchCategories({ companyId }));
      void dispatch(fetchUnits({ companyId }));
    }
  }, [dispatch, companyId]);

  const tree = buildTree(categories);

  const unitOptions = units.map((u) => ({
    id: u.id,
    unitName: u.unitName,
    conversionFactorToBase: u.conversionFactorToBase,
    isBaseUnit: u.isBaseUnit,
  }));

  const selectedUnit = unitOptions.find((u) => u.id === selectedUnitId);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameAr.trim() || !companyId) return;
    setActionError(null);
    try {
      await dispatch(createCategory({
        name: { ar: newNameAr.trim(), en: newNameEn.trim() || undefined },
        parentId: selectedCategoryId,
        companyId,
      })).unwrap();
      setNewNameAr(''); setNewNameEn(''); setShowAddForm(false);
      void dispatch(fetchCategories({ companyId }));
    } catch (err) { setActionError(String(err)); }
  };

  const selectedName = categories.find((c) => c.id === selectedCategoryId)?.name.ar;

  return (
    <div className="page">
      <div className="sticky-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('categories.title')}</h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{t('categories.tree')}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm((v) => !v)}>
            <Icon name="plus" size={16} />
            {showAddForm ? t('common.close') : t('categories.addCategory')}
          </button>
        </div>
      </div>

      {actionError && <div className="error-banner">{actionError}</div>}

      {showAddForm && (
        <form onSubmit={handleAddCategory} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontWeight: 700 }}>
            {selectedCategoryId ? t('categories.addChild') : t('categories.newCategory')}
          </p>
          {selectedCategoryId && selectedName && (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {t('categories.newParent')}: {selectedName}
            </p>
          )}
          <div className="form-field">
            <label className="form-label" htmlFor="cat-ar-m">{t('categories.nameAr')} *</label>
            <input id="cat-ar-m" className="form-input" value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} required />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="cat-en-m">{t('categories.nameEn')}</label>
            <input id="cat-en-m" className="form-input" value={newNameEn} onChange={(e) => setNewNameEn(e.target.value)} />
          </div>
          <div className="row">
            <button type="submit" className="btn btn-primary btn-sm">{t('common.add')}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {catalogStatus === 'loading' && categories.length === 0 ? (
        <div className="loading">{t('common.loading')}</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon"><Icon name="tag" size={24} /></span>
          <p className="empty-state-title">{t('categories.noCategories')}</p>
          <p>{t('empty.addFirst')}</p>
        </div>
      ) : (
        <ul role="tree" aria-label={t('categories.tree')} style={{ listStyle: 'none', padding: 0, background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {tree.map((node) => (
            <AccordionNode
              key={node.id}
              node={node}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          ))}
        </ul>
      )}

      {selectedCategoryId && (
        <div className="card row-between" style={{ gap: 'var(--space-2)', minHeight: 'var(--touch-target)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{selectedName}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMovePicker(true)}>
            <Icon name="move" size={14} />
            {t('categories.moveCategory')}
          </button>
        </div>
      )}

      {showMovePicker && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <p style={{ fontWeight: 700 }}>
            {t('categories.moveCategory')}: {selectedName}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {moveTargets.map((target) => (
              <button
                key={target.id ?? 'root'}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ textAlign: 'start' }}
                onClick={() => void handleMove(target.id)}
              >
                {target.name}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowMovePicker(false)}>{t('common.cancel')}</button>
        </div>
      )}

      <button
        type="button"
        className="card row-between"
        style={{ width: '100%', textAlign: 'start', cursor: 'pointer', minHeight: 'var(--touch-target)' }}
        onClick={() => setShowUnitPicker(true)}
      >
        <span style={{ color: selectedUnit ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
          {selectedUnit ? `${t('catalog.units')}: ${selectedUnit.unitName}` : t('catalog.units')}
        </span>
        <span style={{ color: 'var(--color-text-secondary)' }}><Icon name="chevron-left" size={18} /></span>
      </button>

      {showUnitPicker && (
        <UnitPickerModal
          units={unitOptions}
          selectedId={selectedUnitId ?? undefined}
          onSelect={(unit) => { setSelectedUnitId(unit.id); setShowUnitPicker(false); }}
          onClose={() => setShowUnitPicker(false)}
        />
      )}
    </div>
  );
}
