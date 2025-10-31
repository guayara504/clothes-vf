// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../services/api';
import { Wallet } from '@mercadopago/sdk-react';
import {
  Container, Typography, Box, TextField, Button,
  CircularProgress, Snackbar, Alert, Grid, Divider
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';

function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false); // Un solo estado de carga
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [formValid, setFormValid] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);

  // Valida que el formulario de envío esté completo
  useEffect(() => {
    const isValid = customerDetails.name && customerDetails.email && customerDetails.address && customerDetails.phone;
    setFormValid(isValid);
  }, [customerDetails]);

  // --- EFECTO PARA CREAR LA PREFERENCIA DE PAGO AUTOMÁTICAMENTE ---
  useEffect(() => {
    // Se ejecuta solo si el formulario es válido y no tenemos ya un preferenceId
    if (formValid &&!preferenceId) {
      const createPreference = async () => {
        setLoading(true); // Muestra un indicador de carga general
        const orderData = {
          customerDetails,
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: cartTotal,
          paymentMethod: 'MERCADOPAGO',
        };
        try {
          const response = await placeOrder(orderData);
          if (response.data.status === 'requires_mercadopago_checkout') {
            setPreferenceId(response.data.preferenceId);
          } else {
            throw new Error('No se pudo generar la preferencia de pago.');
          }
        } catch (err) {
          console.error("Error al crear la preferencia:", err);
          setNotification({ open: true, message: 'Error al inicializar Mercado Pago.', severity: 'error' });
        } finally {
          setLoading(false);
        }
      };
      createPreference();
    }
  }, [formValid, preferenceId, customerDetails, cartItems, cartTotal]); // Dependencias del efecto

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prevState => ({...prevState, [name]: value }));
    setPreferenceId(null); // Resetea la preferencia si el usuario cambia los datos
  };

// --- Manejador para el botón de Pago Contraentrega ---
const handleContraentregaSubmit = async () => {
  if (!formValid) return;
  setLoading(true);
  const orderData = {
    customerDetails,
    items: cartItems.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: cartTotal,
    paymentMethod: 'CONTRAENTREGA',
  };
  try {
    const response = await placeOrder(orderData);
    if (response.data.status === 'success') {
      setNotification({ open: true, message: '¡Pedido realizado con éxito!', severity: 'success' });
      clearCart();
      navigate('/pago/respuesta');
    } else {
      throw new Error(response.data.message || 'Error desconocido.');
    }
  } catch (err) {
    setNotification({ open: true, message: err.message || 'Error al enviar el pedido.', severity: 'error' });
  } finally {
    setLoading(false);
  }
};

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification(prevState => ({...prevState, open: false }));
  };

  if (cartItems.length === 0) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Tu carrito está vacío.</Typography>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>
          Volver a la tienda
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 4 }}>
        Finalizar Compra
      </Typography>

      <Box>
        <Typography variant="h6" gutterBottom>Datos de Envío</Typography>
        <TextField name="name" label="Nombre Completo" fullWidth margin="normal" onChange={handleInputChange} required value={customerDetails.name} />
        <TextField name="email" label="Correo Electrónico" type="email" fullWidth margin="normal" onChange={handleInputChange} required value={customerDetails.email} />
        <TextField name="address" label="Dirección de Envío" fullWidth margin="normal" onChange={handleInputChange} required value={customerDetails.address} />
        <TextField name="phone" label="Teléfono" fullWidth margin="normal" onChange={handleInputChange} required value={customerDetails.phone} />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Método de Pago</Typography>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Total a Pagar: ${new Intl.NumberFormat('es-CO').format(cartTotal)}
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              sx={{ p: 1.5, height: '56px' }}
              onClick={handleContraentregaSubmit}
              disabled={loading ||!formValid}
            >
              {loading? <CircularProgress size={24} /> : 'Pagar Contraentrega'}
            </Button>
          </Grid>
          <Grid item xs={12} md={6} sx={{ minHeight: '56px' }}>
            {/* Muestra un loader mientras se genera la preferencia, o el botón si ya está listo */}
            {loading && <CircularProgress />}
            {!loading && preferenceId && (
              <Wallet initialization={{ preferenceId: preferenceId }} />
            )}
            {/* Muestra un placeholder si el formulario no es válido */}
            {!loading &&!formValid && (
              <Typography variant="caption" color="text.secondary">
                Completa tus datos para ver la opción de pago.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default CheckoutPage;