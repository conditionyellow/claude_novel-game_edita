import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('main.tsx executing');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', !!rootElement);
  
  ReactDOM.createRoot(rootElement!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('React app mounted successfully');
} catch (error) {
  console.error('Failed to mount React app:', error);
  document.body.innerHTML = `<div>Mount Error: ${String(error)}</div>`;
}