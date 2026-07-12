'use client';

import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '../lib/store';
import { LocaleProvider, ToastProvider } from '@packages/ui-components';
import { setLocale } from '@packages/shared-kernel';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <LocaleProvider locale="ar" onChange={(locale) => setLocale(locale)}>
        <ToastProvider>{children}</ToastProvider>
      </LocaleProvider>
    </Provider>
  );
}
