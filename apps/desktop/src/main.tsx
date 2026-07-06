import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('[Desktop] Root element #root not found in index.html');
}

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
