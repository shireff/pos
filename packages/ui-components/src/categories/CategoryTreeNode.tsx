import React, { useState } from 'react';

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
}: CategoryTreeNodeProps): React.ReactElement {
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
    <li
      style={{ listStyle: 'none', paddingLeft: depth > 0 ? 20 : 0 }}
      aria-expanded={hasChildren ? expanded : undefined}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 0',
          opacity: node.isDeleted ? 0.45 : 1,
        }}
      >
        <button
          type="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            width: 18,
            height: 18,
            border: 'none',
            background: 'none',
            cursor: hasChildren ? 'pointer' : 'default',
            color: hasChildren ? '#555' : 'transparent',
            flexShrink: 0,
            fontSize: 12,
          }}
        >
          {hasChildren ? (expanded ? '▾' : '▸') : ''}
        </button>

        {editing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={handleKeyDown}
            aria-label="Rename category"
            style={{ fontSize: 14, padding: '2px 4px', borderRadius: 4, border: '1px solid #aaa' }}
          />
        ) : (
          <span
            onDoubleClick={() => !node.isDeleted && setEditing(true)}
            title={node.name.en}
            style={{ fontSize: 14, cursor: node.isDeleted ? 'default' : 'text', flexGrow: 1 }}
          >
            {node.name.ar}
            {node.name.en && (
              <span style={{ color: '#888', marginLeft: 6, fontSize: 12 }}>({node.name.en})</span>
            )}
          </span>
        )}

        {!node.isDeleted && (
          <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            <button
              type="button"
              aria-label="Add child category"
              onClick={() => onAddChild?.(node.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#2563eb',
              }}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Delete category"
              onClick={() => onDelete?.(node.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#dc2626',
              }}
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <ul style={{ margin: 0, padding: 0 }} role="group">
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
