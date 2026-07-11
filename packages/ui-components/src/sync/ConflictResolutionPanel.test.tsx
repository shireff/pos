import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConflictResolutionPanel } from './ConflictResolutionPanel';
import type { SyncConflictView } from '../stores/sync.store';

const conflict: SyncConflictView = {
  id: 'cf-1',
  entityType: 'products',
  entityId: 'p1',
  field: 'price',
  localValue: 100,
  remoteValue: 120,
  status: 'unresolved',
  createdAt: '2026-07-10T12:00:00.000Z',
};

describe('ConflictResolutionPanel', () => {
  it('shows local and remote values side by side', () => {
    const html = renderToString(
      React.createElement(ConflictResolutionPanel, { conflict, onResolve: () => undefined }),
    );
    expect(html).toContain('100');
    expect(html).toContain('120');
    expect(html).toContain('price');
  });

  it('renders resolution buttons for an unresolved conflict', () => {
    const html = renderToString(
      React.createElement(ConflictResolutionPanel, { conflict, onResolve: () => undefined }),
    );
    expect(html).toContain('Keep Local');
    expect(html).toContain('Keep Remote');
    expect(html).toContain('Merge');
  });

  it('hides the buttons once resolved and shows the audit trail', () => {
    const resolved: SyncConflictView = {
      ...conflict,
      status: 'resolved_remote',
      auditTrail: [
        { at: '2026-07-10T12:05:00.000Z', byUserId: 'u1', resolution: 'resolved_remote', value: 120 },
      ],
    };
    const html = renderToString(
      React.createElement(ConflictResolutionPanel, { conflict: resolved, onResolve: () => undefined }),
    );
    expect(html).not.toContain('Keep Local');
    expect(html).toContain('resolved_remote');
    expect(html).toContain('u1');
  });
});
