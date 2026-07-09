import { useState } from 'react';
import { useT } from '../i18n';
import { Icon } from '../components/Icon';

export interface CategoryTreeNodeData {
  id: string;
  name: { ar: string; en?: string };
  parentId: string | null;
  sortOrder: number;
  level: number;
  path: string;
  isDeleted: boolean;
  children: CategoryTreeNodeData[];
}

export interface CategoryTreeNodeProps {
  node: CategoryTreeNodeData;
  onRename?: (id: string, name: { ar: string; en?: string }) => void;
  onAddChild?: (parentId: string) => void;
  onDelete?: (id: string) => void;
  depth?: number;
}

export function CategoryTreeNode({
  node,
  onRename,
  onAddChild,
  onDelete,
  depth = 0,
}: CategoryTreeNodeProps): JSX.Element {
  const t = useT();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name.ar);

  const hasChildren = node.children.length > 0;

  function handleRenameCommit(): void {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== node.name.ar) {
      onRename?.(node.id, { ar: trimmed, en: node.name.en });
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') {
      setEditValue(node.name.ar);
      setEditing(false);
    }
  }

  return (
    <li className="accordion-item" style={{ marginInlineStart: depth > 0 ? 'var(--space-4)' : 0 }} aria-expanded={hasChildren ? expanded : undefined}>
      <div className="accordion-btn" style={{ opacity: node.isDeleted ? 0.55 : 1 }}>
        <button
          type="button"
          aria-label={expanded ? t('nav.collapse') : t('nav.expand')}
          onClick={() => setExpanded((prev) => !prev)}
          className="btn btn-ghost btn-icon btn-sm"
          style={{ color: hasChildren ? 'var(--color-text-secondary)' : 'transparent', cursor: hasChildren ? 'pointer' : 'default' }}
        >
          {hasChildren && <Icon name="chevron-left" size={16} />}
        </button>

        {editing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={handleKeyDown}
            aria-label={t('categories.rename')}
            className="form-input"
            style={{ height: 32 }}
          />
        ) : (
          <span
            onDoubleClick={() => !node.isDeleted && setEditing(true)}
            title={node.name.en}
            style={{ fontSize: 'var(--font-size-sm)', cursor: node.isDeleted ? 'default' : 'text', flexGrow: 1 }}
          >
            {node.name.ar}
            {node.name.en && (
              <span style={{ color: 'var(--color-text-tertiary)', marginInlineStart: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
                ({node.name.en})
              </span>
            )}
          </span>
        )}

        {!node.isDeleted && (
          <span className="row" style={{ marginInlineStart: 'auto', gap: 'var(--space-1)' }}>
            <button type="button" aria-label={t('categories.addChild')} className="btn btn-ghost btn-icon btn-sm" onClick={() => onAddChild?.(node.id)}>
              <Icon name="plus" size={16} />
            </button>
            <button type="button" aria-label={t('categories.delete')} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => onDelete?.(node.id)}>
              <Icon name="trash" size={16} />
            </button>
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <ul role="group" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              onRename={onRename}
              onAddChild={onAddChild}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
