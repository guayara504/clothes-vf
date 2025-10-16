// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useCart } from './context/CartContext'; // Importar useCart
import HomePage from './pages/HomePage';
import ProductManagement from './pages/ProductManagement';
import ProductDetailPage from './pages/ProductDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import Cart from './components/Cart'; // Importar el componente del carrito
import {
  AppBar, Toolbar, Typography, Button, Container, IconButton, Badge
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { itemCount } = useCart(); // Obtener el número de items del contexto

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };
  return (
    <div>
      {/* --- Barra de Navegación Mejorada --- */}
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
          <IconButton color="inherit" onClick={toggleCart}>
            <Badge badgeContent={itemCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* --- Panel Lateral del Carrito --- */}
      <Cart open={isCartOpen} onClose={toggleCart} />

      {/* --- Definición de Rutas --- */}
      <main>
        <Container sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
}

export default App;