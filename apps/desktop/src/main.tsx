import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './app/App';
import { store } from './lib/store';

const container = document.getElementById('root');
if (!container) {
  throw new Error('[Desktop] Root element #root not found in index.html');
}

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
