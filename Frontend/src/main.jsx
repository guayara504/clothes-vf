// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- 1. IMPORTAR
import { CartProvider } from './context/CartContext'; // <-- 1. IMPORTAR CartContext
import { initMercadoPago } from '@mercadopago/sdk-react';
import App from './App.jsx';
import './index.css';

// Inicializa el SDK con tu Clave Pública de PRUEBA
initMercadoPago('APP_USR-883503c0-ade9-4806-bf1c-7320ee82976f'); // <-- PUBLIC KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- 2. ENVOLVER APP CON EL ENRRUTADOR */}
      <CartProvider> {/* <-- 2. ENVOLVER APP CON EL CARRITO */}
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);