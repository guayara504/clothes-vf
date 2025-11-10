import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { useCart } from './context/CartContext';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductManagement from './pages/ProductManagement';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OrdersManagement from './pages/OrdersManagement';
import UserDashboard from './pages/UserDashboard';
import NotFoundPage from './pages/NotFoundPage';
import Cart from './components/Cart';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { itemCount } = useCart();

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Header onCartOpen={toggleCart} />

      {/* Panel Lateral del Carrito */}
      <Cart open={isCartOpen} onClose={toggleCart} />

      {/* Contenido Principal */}
      <Box component="main" sx={{ flexGrow: 1, pb: 8 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/orders" element={<OrdersManagement />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
}

export default App;
