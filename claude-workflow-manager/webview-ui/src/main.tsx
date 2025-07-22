import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Ensure the DOM is ready
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}

// Create and render the React app
const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);