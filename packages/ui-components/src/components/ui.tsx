import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useT } from '../i18n';
import { Icon, type IconName } from './Icon';

/* ── Modal ──────────────────────────────────────────────────────────────── */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal${size === 'lg' ? ' is-lg' : ''}`}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button type="button" className="modal-close" aria-label={t('common.close')} onClick={onClose}>
              <Icon name="x" size={20} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Field ─────────────────────────────────────────────────────────────── */
export interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}
export function Field({ label, required, error, hint, children, htmlFor }: FieldProps) {
  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="form-required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="form-error" role="alert">{error}</span>
      ) : hint ? (
        <span className="form-hint">{hint}</span>
      ) : null}
    </div>
  );
}

/* ── EmptyState / Spinner ───────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title?: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state__icon">{icon}</span>}
      {title && <div className="empty-state__title">{title}</div>}
      {desc && <div className="empty-state__desc">{desc}</div>}
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="loading">
      <span className="spinner" />
      {label}
    </div>
  );
}

/* ── StatCard ──────────────────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  meta,
  icon,
  accent,
}: {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card${accent ? ' is-primary' : ''}`}>
      <div className="row-between">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <span className="stat-value">{value}</span>
      {meta && <span className="stat-meta">{meta}</span>}
    </div>
  );
}

/* ── Sidebar / Navigation ──────────────────────────────────────────────── */
export function Sidebar({
  brand,
  children,
  footer,
  collapsed,
}: {
  brand?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
}) {
  const t = useT();
  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`}>
      {brand}
      <nav className="sidebar__nav" aria-label={t('nav.main')}>{children}</nav>
      {footer && <div className="sidebar__footer">{footer}</div>}
    </aside>
  );
}

export function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`nav-item${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <span className="nav-item__icon"><Icon name={icon} size={20} /></span>
      <span className="nav-item__label">{label}</span>
      {badge && <span className="nav-item__badge">{badge}</span>}
    </button>
  );
}

export function NavGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="nav-group">
      {label && <div className="nav-group__label">{label}</div>}
      {children}
    </div>
  );
}

/* ── Toast system ──────────────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  msg?: string;
}
interface ToastContextValue {
  push: (t: Omit<ToastItem, 'id'>) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((x) => x.id !== id))} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  return { push: () => {} };
}

const TOAST_ICON: Record<ToastType, IconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info' as IconName,
  warning: 'alert-triangle',
};

function ToastRegion({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const t = useT();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-region" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
          <span className="toast__icon"><Icon name={TOAST_ICON[toast.type]} size={18} /></span>
          <div className="toast__body">
            {toast.title && <div className="toast__title">{toast.title}</div>}
            {toast.msg && <div className="toast__msg">{toast.msg}</div>}
          </div>
          <button type="button" className="toast__close" aria-label={t('common.close')} onClick={() => onDismiss(toast.id)}>
            <Icon name="x" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
