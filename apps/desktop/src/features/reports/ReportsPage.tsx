import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchDailySales,
  fetchProfitLoss,
  fetchInventoryValuation,
  fetchStockMovements,
  fetchBranchComparison,
  fetchEmployeePerformance,
  fetchCustomerLoyalty,
  fetchTaxReport,
  fetchSupplierPerformance,
  fetchStoreHealth,
  fetchCashFlow,
} from '../../lib/store/reportsSlice';
import { Icon, useT, type IconName } from '@packages/ui-components';

type ReportTab = 'daily-sales' | 'pnl' | 'inventory-valuation' | 'stock-movements' | 'branch-comparison' | 'employee-performance' | 'customer-loyalty' | 'tax' | 'supplier-performance' | 'store-health' | 'cash-flow';

export function ReportsPage({ isOffline = false }: { isOffline?: boolean }): React.ReactElement {
  const t = useT();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<ReportTab>('daily-sales');
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');
  const reports = useAppSelector((state: any) => state.reports);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchCurrentReport();
  }, [tab, companyId]);

  const fetchCurrentReport = async () => {
    setLoading(true);
    try {
      switch (tab) {
        case 'daily-sales':
          await dispatch(fetchDailySales({ branchId: '', date: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'pnl':
          await dispatch(fetchProfitLoss({ from: new Date().toISOString().slice(0, 7) + '-01', to: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'inventory-valuation':
          await dispatch(fetchInventoryValuation({ date: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'stock-movements':
          await dispatch(fetchStockMovements({ warehouseId: '', from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'branch-comparison':
          await dispatch(fetchBranchComparison({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'employee-performance':
          await dispatch(fetchEmployeePerformance({ branchId: '', from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'customer-loyalty':
          await dispatch(fetchCustomerLoyalty({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'tax':
          await dispatch(fetchTaxReport({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })).unwrap();
          break;
        case 'supplier-performance':
          await dispatch(fetchSupplierPerformance({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
        case 'store-health':
          await dispatch(fetchStoreHealth({ companyId })).unwrap();
          break;
        case 'cash-flow':
          await dispatch(fetchCashFlow({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) })).unwrap();
          break;
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await fetch(`/api/v1/reports/${tab}/export?format=${format}&companyId=${encodeURIComponent(companyId)}`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tab}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // handle error
    }
  };

  const getReportData = (): Record<string, unknown> | null => {
    switch (tab) {
      case 'daily-sales': return reports.dailySales;
      case 'pnl': return reports.profitLoss;
      case 'inventory-valuation': return reports.inventoryValuation;
      case 'stock-movements': return reports.stockMovements;
      case 'branch-comparison': return reports.branchComparison;
      case 'employee-performance': return reports.employeePerformance;
      case 'customer-loyalty': return reports.customerLoyalty;
      case 'tax': return reports.tax;
      case 'supplier-performance': return reports.supplierPerformance;
      case 'store-health': return reports.storeHealth;
      case 'cash-flow': return reports.cashFlow;
      default: return null;
    }
  };

  return (
    <div className="page">
      {isOffline && (
        <div className="offline-banner" style={{ padding: 'var(--space-2)', background: 'var(--color-warning)', color: 'var(--color-text-inverse)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          {t('reports.offlineLimited')}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('reports.title')}</h1>
          <p className="page-subtitle">{t('reports.viewAndExportBusinessReports')}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => handleExport('csv')}>{t('reports.exportCsv')}</button>
          <button type="button" className="btn btn-secondary" onClick={() => handleExport('json')}>{t('reports.exportJson')}</button>
        </div>
      </div>
      <div className="reports-layout">
        <nav className="reports-sidebar" aria-label="Reports">
          {([
            { key: 'daily-sales', label: t('reports.dailySales'), icon: 'clock' },
            { key: 'pnl', label: t('reports.profitLoss'), icon: 'wallet' },
            { key: 'inventory-valuation', label: t('reports.inventoryValuation'), icon: 'package' },
            { key: 'stock-movements', label: t('reports.stockMovements'), icon: 'archive' },
            { key: 'branch-comparison', label: t('reports.branchComparison'), icon: 'bar-chart' },
            { key: 'employee-performance', label: t('reports.employeePerformance'), icon: 'users' },
            { key: 'customer-loyalty', label: t('reports.customerLoyalty'), icon: 'bell' },
            { key: 'tax', label: t('reports.tax'), icon: 'receipt' },
            { key: 'supplier-performance', label: t('reports.supplierPerformance'), icon: 'box' },
            { key: 'store-health', label: t('reports.storeHealth'), icon: 'activity' },
            { key: 'cash-flow', label: t('reports.cashFlow'), icon: 'credit-card' },
          ] as { key: ReportTab; label: string; icon: IconName }[]).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`reports-sidebar__item${tab === item.key ? ' active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              <Icon name={item.icon} size={16} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="reports-content">
          {loading ? <div className="spinner-wrap"><span className="spinner" /></div> : (
            <pre style={{ background: 'var(--color-bg-inset)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', overflow: 'auto' }}>
              {JSON.stringify(getReportData(), null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
