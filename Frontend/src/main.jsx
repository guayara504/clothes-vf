// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- 1. IMPORTAR
import { CartProvider } from './context/CartContext'; // <-- 1. IMPORTAR CartContext
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- 2. ENVOLVER APP CON EL ENRRUTADOR */}
      <CartProvider> {/* <-- 2. ENVOLVER APP CON EL CARRITO */}
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);