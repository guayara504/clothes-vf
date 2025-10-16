// src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductManagement from './pages/ProductManagement';
import ProductDetailPage from './pages/ProductDetailPage'; // <-- 1. IMPORTAR
import NotFoundPage from './pages/NotFoundPage';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

function App() {
  return (
    <div>
      {/* --- Barra de Navegación Simple --- */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Button component={Link} to="/" color="inherit">
              Clothes VF
            </Button>
          </Typography>
          <Button component={Link} to="/admin/products" color="inherit">
            Panel de Admin
          </Button>
        </Toolbar>
      </AppBar>

      {/* --- Definición de Rutas --- */}
      <main>
        <Container sx={{ py: 4 }}>
          <Routes>
            {/* Ruta para la tienda pública */}
            <Route path="/" element={<HomePage />} />

            {/* --- 2. AÑADIR LA NUEVA RUTA DINÁMICA --- */}
            <Route path="/product/:productId" element={<ProductDetailPage />} />

            {/* Ruta para el panel de administración */}
            <Route path="/admin/products" element={<ProductManagement />} />

            {/* Ruta para cualquier otra URL no encontrada */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
}

export default App;