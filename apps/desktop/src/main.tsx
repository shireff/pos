import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './styles/base.css';
import './styles/platform-admin.css';
import '@packages/ui-components/src/styles/index.css';
import App from './app/App';
import { store } from './lib/store';
import { LocaleProvider, ToastProvider } from '@packages/ui-components';
import { setLocale } from '@packages/shared-kernel';

const container = document.getElementById('root');
if (!container) {
  throw new Error('[Desktop] Root element #root not found in index.html');
}

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <LocaleProvider locale="ar" onChange={(locale) => setLocale(locale)}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </LocaleProvider>
    </Provider>
  </React.StrictMode>,
);
