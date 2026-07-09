import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Paywall } from './paywall';

describe('Paywall', () => {
  it('renders an upgrade CTA for trial expiry', () => {
    const html = renderToString(React.createElement(Paywall, { mode: 'trial_expired' }));
    expect(html).toContain('اختر باقة');
  });

  it('renders support contact for suspended accounts', () => {
    const html = renderToString(React.createElement(Paywall, { mode: 'suspended' }));
    expect(html).toContain('تواصل مع الدعم');
  });
});
