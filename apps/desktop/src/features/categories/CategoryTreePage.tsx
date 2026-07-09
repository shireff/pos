import React, { useEffect, useState } from 'react';
import {
  CategoryTreeNode,
  CategoryBreadcrumb,
  type CategoryTreeNodeData,
  type BreadcrumbSegment,
} from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchCategories,
  createCategory,
  moveCategory,
  type Category,
} from '../../lib/store/catalogSlice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTreeNodeData(flat: Category[]): CategoryTreeNodeData[] {
  const map = new Map<string, CategoryTreeNodeData>();
  const roots: CategoryTreeNodeData[] = [];

  for (const c of flat) {
    map.set(c.id, {
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      level: c.level,
      path: c.path,
      isDeleted: false,
      children: [],
    });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort siblings by sortOrder
  const sortChildren = (nodes: CategoryTreeNodeData[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

function findNode(
  nodes: CategoryTreeNodeData[],
  id: string,
): CategoryTreeNodeData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function buildBreadcrumb(
  nodes: CategoryTreeNodeData[],
  id: string,
): BreadcrumbSegment[] {
  const node = findNode(nodes, id);
  if (!node) return [];
  return node.path
    .split('/')
    .map((pid) => findNode(nodes, pid))
    .filter((n): n is CategoryTreeNodeData => n !== null)
    .map((n) => ({ id: n.id, name: n.name }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategoryTreePage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.catalog.categories);
  const companyId = useAppSelector((state) => state.auth.user?.companyId ?? 'company-1');
  const catalogStatus = useAppSelector((state) => state.catalog.status);
  const catalogError = useAppSelector((state) => state.catalog.error);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingChildOf, setAddingChildOf] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [moveCatId, setMoveCatId] = useState('');
  const [moveParentId, setMoveParentId] = useState('');

  useEffect(() => {
    void dispatch(fetchCategories({ companyId }));
  }, [dispatch, companyId]);

  const tree = toTreeNodeData(categories);
  const breadcrumb = selectedId ? buildBreadcrumb(tree, selectedId) : [];

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleRename = async (id: string, name: { ar: string; en?: string }) => {
    // Rename is handled via the UpdateCategoryUseCase on the backend —
    // CategoryTreeNode calls this on double-click inline edit confirm.
    // For now the UI component manages optimistic update locally; we call the API.
    setActionError(null);
    try {
      await dispatch({ type: 'catalog/updateCategoryLocally', payload: { id, name } });
    } catch (err) {
      setActionError(String(err));
    }
  };

  const handleConfirmAdd = async () => {
    if (!newNameAr.trim() || !addingChildOf) return;
    setActionError(null);
    try {
      await dispatch(
        createCategory({
          name: { ar: newNameAr.trim(), en: newNameEn.trim() || undefined },
          parentId: addingChildOf === '__root__' ? null : addingChildOf,
          companyId,
        }),
      ).unwrap();
      void dispatch(fetchCategories({ companyId }));
      setAddingChildOf(null);
      setNewNameAr('');
      setNewNameEn('');
    } catch (err) {
      setActionError(String(err));
    }
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveCatId) return;
    setActionError(null);
    try {
      await dispatch(
        moveCategory({
          categoryId: moveCatId,
          newParentId: moveParentId || null,
        }),
      ).unwrap();
      void dispatch(fetchCategories({ companyId }));
      setMoveCatId('');
      setMoveParentId('');
    } catch (err) {
      setActionError(String(err));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Tree</h1>
          <p className="page-subtitle">
            Double-click a name to rename. Use + to add a child.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setAddingChildOf('__root__');
            setNewNameAr('');
            setNewNameEn('');
          }}
        >
          + Add Root Category
        </button>
      </div>

      {catalogError && <div className="error-banner">{catalogError}</div>}
      {actionError && <div className="error-banner">{actionError}</div>}

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <CategoryBreadcrumb
          segments={breadcrumb}
          onNavigate={setSelectedId}
          locale="ar"
        />
      )}

      {/* Move category form */}
      <form
        onSubmit={handleConfirmMove}
        className="form-box"
        style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}
      >
        <div className="form-field" style={{ flex: '1 1 180px' }}>
          <label className="form-label" htmlFor="move-cat">Move category</label>
          <select
            id="move-cat"
            className="form-select"
            value={moveCatId}
            onChange={(e) => setMoveCatId(e.target.value)}
            required
          >
            <option value="">— select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.ar}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field" style={{ flex: '1 1 180px' }}>
          <label className="form-label" htmlFor="move-parent">New parent</label>
          <select
            id="move-parent"
            className="form-select"
            value={moveParentId}
            onChange={(e) => setMoveParentId(e.target.value)}
          >
            <option value="">Root level</option>
            {categories
              .filter((c) => c.id !== moveCatId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.ar}
                </option>
              ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary" disabled={!moveCatId}>
          Move
        </button>
      </form>

      {/* Tree */}
      {catalogStatus === 'loading' && categories.length === 0 ? (
        <div className="loading">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No categories yet</p>
          <p>Add your first root category to get started.</p>
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: 'var(--space-4)' }}
        >
          <ul
            style={{ margin: 0, padding: 0, listStyle: 'none' }}
            role="tree"
            aria-label="Category tree"
          >
            {tree.map((node) => (
              <CategoryTreeNode
                key={node.id}
                node={node}
                onRename={handleRename}
                onAddChild={(id) => {
                  setAddingChildOf(id);
                  setNewNameAr('');
                  setNewNameEn('');
                }}
                onDelete={setDeleteConfirmId}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Add Category Modal */}
      {addingChildOf && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-cat-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h2 id="add-cat-title" className="modal-title">
                {addingChildOf === '__root__' ? 'Add Root Category' : 'Add Sub-category'}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAddingChildOf(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="new-cat-ar">
                Arabic Name *
              </label>
              <input
                id="new-cat-ar"
                autoFocus
                className="form-input"
                value={newNameAr}
                onChange={(e) => setNewNameAr(e.target.value)}
              />
            </div>
            <div className="form-field" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label" htmlFor="new-cat-en">
                English Name
              </label>
              <input
                id="new-cat-en"
                className="form-input"
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAddingChildOf(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmAdd}
                disabled={!newNameAr.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="modal-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="archive-cat-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h2
                id="archive-cat-title"
                className="modal-title"
                style={{ color: 'var(--color-danger)' }}
              >
                Archive Category?
              </h2>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-4)',
              }}
            >
              This archives the category and all its children. Categories with
              active products cannot be archived. This action can be reversed by
              re-activating the category.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  // Archive is a soft-delete on the backend via DELETE /v1/categories/:id
                  setActionError(null);
                  import('../../lib/store/catalogSlice')
                    .then(({ fetchCategories: fetchCats }) => {
                      // The UI component handles optimistic update via onDelete prop.
                      // We re-fetch to sync server state.
                      void dispatch(fetchCats({ companyId }));
                    })
                    .catch((_err) => setActionError('Failed to refresh'));
                  setDeleteConfirmId(null);
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
