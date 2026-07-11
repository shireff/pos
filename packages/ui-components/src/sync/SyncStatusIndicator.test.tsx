import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import type { SyncStatusView } from '../stores/sync.store';

const base: SyncStatusView = {
  companyId: 'c1',
  pendingOutbox: 3,
  pendingInbox: 1,
  lastSyncedAt: '2026-07-10T12:00:00.000Z',
  transportType: 'lan',
  offline: false,
};

describe('SyncStatusIndicator', () => {
  it('renders the transport label, pending count, and last sync time', () => {
    const html = renderToString(React.createElement(SyncStatusIndicator, { status: base }));
    expect(html).toContain('LAN');
    expect(html).toContain('4'); // 3 outbox + 1 inbox
    expect(html).toContain('Last sync:');
  });

  it('shows an offline indicator when offline', () => {
    const html = renderToString(
      React.createElement(SyncStatusIndicator, { status: { ...base, offline: true } }),
    );
    expect(html).toContain('Offline');
  });

  it('hides the pending badge when nothing is pending', () => {
    const html = renderToString(
      React.createElement(SyncStatusIndicator, {
        status: { ...base, pendingOutbox: 0, pendingInbox: 0 },
      }),
    );
    expect(html).not.toContain('>0<');
  });
});
