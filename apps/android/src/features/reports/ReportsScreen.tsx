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
import { Icon, type IconName, useT } from '@packages/ui-components';

type ReportTab = 'daily-sales' | 'pnl' | 'inventory-valuation' | 'stock-movements' | 'branch-comparison' | 'employee-performance' | 'customer-loyalty' | 'tax' | 'supplier-performance' | 'store-health' | 'cash-flow';

export function ReportsScreen(): React.ReactElement {
  const t = useT();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<ReportTab>('daily-sales');
  const companyId = useAppSelector((s: any) => s.auth.user?.companyId ?? 'company-1');
  const reports = useAppSelector((s: any) => s.reports);
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

  const tabIcons: Record<ReportTab, IconName> = {
    'daily-sales': 'clock',
    'pnl': 'wallet',
    'inventory-valuation': 'package',
    'stock-movements': 'archive',
    'branch-comparison': 'bar-chart',
    'employee-performance': 'users',
    'customer-loyalty': 'bell',
    'tax': 'receipt',
    'supplier-performance': 'box',
    'store-health': 'activity',
    'cash-flow': 'credit-card',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>{t('reports.title')}</h1>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {([
          { key: 'daily-sales', label: t('reports.dailySales') },
          { key: 'pnl', label: t('reports.profitLoss') },
          { key: 'inventory-valuation', label: t('reports.inventoryValuation') },
          { key: 'stock-movements', label: t('reports.stockMovements') },
          { key: 'branch-comparison', label: t('reports.branchComparison') },
          { key: 'employee-performance', label: t('reports.employeePerformance') },
          { key: 'customer-loyalty', label: t('reports.customerLoyalty') },
          { key: 'tax', label: t('reports.tax') },
          { key: 'supplier-performance', label: t('reports.supplierPerformance') },
          { key: 'store-health', label: t('reports.storeHealth') },
          { key: 'cash-flow', label: t('reports.cashFlow') },
        ] as { key: ReportTab; label: string }[]).map((item) => (
          <button
            key={item.key}
            type="button"
            className={`btn btn-sm${tab === item.key ? ' btn-primary' : ' btn-secondary'}`}
            onClick={() => setTab(item.key)}
            style={{ touchAction: 'manipulation' }}
          >
            <Icon name={tabIcons[item.key]} size={14} style={{ marginInlineEnd: 'var(--space-1)' }} />
            {item.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="spinner-wrap"><span className="spinner" /></div>
      ) : (
        <pre style={{ background: 'var(--color-bg-inset)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', overflow: 'auto', fontSize: 'var(--font-size-sm)' }}>
          {JSON.stringify(getReportData(), null, 2)}
        </pre>
      )}
    </div>
  );
}
