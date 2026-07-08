import React, { useState } from 'react';
import {
  CategoryTreeNode,
  CategoryTreeNodeData,
  CategoryBreadcrumb,
  BreadcrumbSegment,
} from '@packages/ui-components';

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

function findNode(nodes: CategoryTreeNodeData[], id: string): CategoryTreeNodeData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function buildBreadcrumb(nodes: CategoryTreeNodeData[], id: string): BreadcrumbSegment[] {
  const node = findNode(nodes, id);
  if (!node) return [];
  return node.path
    .split('/')
    .map((pid: string) => findNode(nodes, pid))
    .filter((n: CategoryTreeNodeData | null): n is CategoryTreeNodeData => n !== null)
    .map((n: CategoryTreeNodeData) => ({ id: n.id, name: n.name }));
}

export function CategoryTreePage(): React.ReactElement {
  const [tree, setTree] = useState<CategoryTreeNodeData[]>(seedTree);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addingChildOf, setAddingChildOf] = useState<string | null>(null);
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');

  function handleRename(id: string, name: { ar: string; en?: string }) {
    setTree((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev)) as CategoryTreeNodeData[];
      const node = findNode(cloned, id);
      if (node) node.name = name;
      return cloned;
    });
  }

  function handleConfirmAdd() {
    if (!newNameAr.trim() || !addingChildOf) return;
    const newId = `cat-${Date.now()}`;
    setTree((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev)) as CategoryTreeNodeData[];
      if (addingChildOf === '__root__') {
        cloned.push({
          id: newId,
          name: { ar: newNameAr.trim(), en: newNameEn.trim() || undefined },
          parentId: null,
          sortOrder: cloned.length,
          level: 0,
          path: newId,
          isDeleted: false,
          children: [],
        });
      } else {
        const parent = findNode(cloned, addingChildOf);
        if (parent) {
          parent.children.push({
            id: newId,
            name: { ar: newNameAr.trim(), en: newNameEn.trim() || undefined },
            parentId: addingChildOf,
            sortOrder: parent.children.length,
            level: parent.level + 1,
            path: `${parent.path}/${newId}`,
            isDeleted: false,
            children: [],
          });
        }
      }
      return cloned;
    });
    setAddingChildOf(null);
  }

  function handleConfirmDelete() {
    if (!deleteConfirm) return;
    setTree((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev)) as CategoryTreeNodeData[];
      const node = findNode(cloned, deleteConfirm);
      if (node) node.isDeleted = true;
      return cloned;
    });
    setDeleteConfirm(null);
  }

  const breadcrumb = selectedId ? buildBreadcrumb(tree, selectedId) : [];

  return (
    <div style={{ padding: 24, display: 'grid', gap: 20, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Category Tree</div>
          <div style={{ color: '#57606a', fontSize: 14 }}>
            Double-click a name to rename. Use + to add a child.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setAddingChildOf('__root__');
            setNewNameAr('');
            setNewNameEn('');
          }}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '10px 16px',
            background: '#0969da',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          + Add Root Category
        </button>
      </div>

      {breadcrumb.length > 0 && (
        <CategoryBreadcrumb segments={breadcrumb} onNavigate={setSelectedId} locale="ar" />
      )}

      <div
        style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 12, padding: 16 }}
      >
        <ul style={{ margin: 0, padding: 0 }} role="tree" aria-label="Category tree">
          {tree.map((node) => (
            <CategoryTreeNode
              key={node.id}
              node={node}
              onRename={handleRename}
              onAddChild={(id: string) => {
                setAddingChildOf(id);
                setNewNameAr('');
                setNewNameEn('');
              }}
              onDelete={setDeleteConfirm}
            />
          ))}
        </ul>
      </div>

      {addingChildOf && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 360,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add Category</h2>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Arabic Name *</span>
              <input
                autoFocus
                value={newNameAr}
                onChange={(e) => setNewNameAr(e.target.value)}
                style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: '8px 12px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>English Name</span>
              <input
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: '8px 12px' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setAddingChildOf(null)}
                style={{
                  border: '1px solid #d0d7de',
                  borderRadius: 999,
                  padding: '8px 16px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={!newNameAr.trim()}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '8px 16px',
                  background: '#0969da',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 340,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#cf222e' }}>
              Archive Category?
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: '#57606a' }}>
              This archives the category and all its children. Categories with active products
              cannot be archived.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  border: '1px solid #d0d7de',
                  borderRadius: 999,
                  padding: '8px 16px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '8px 16px',
                  background: '#cf222e',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
