'use client';

import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '../lib/store';
import { LocaleProvider, ToastProvider } from '@packages/ui-components';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <LocaleProvider locale="ar">
        <ToastProvider>{children}</ToastProvider>
      </LocaleProvider>
    </Provider>
  );
}
