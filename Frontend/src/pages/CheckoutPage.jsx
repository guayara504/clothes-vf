// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../services/api'; // Necesitaremos esta nueva función
import {
  Container, Typography, Box, TextField, Button,
  RadioGroup, FormControlLabel, Radio, FormControl, FormLabel,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Para redirigir

function CheckoutPage() {
  const { cartItems, cartTotal } = useCart();
  const navigate = useNavigate(); // Hook para la navegación
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    address: '',
    phone: '' // Añadimos teléfono
  });
  const [paymentMethod, setPaymentMethod] = useState('CONTRAENTREGA'); // Valor por defecto
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prevState => ({ ...prevState, [name]: value }));
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página
    setLoading(true);

    const orderData = {
      customerDetails,
      items: cartItems.map(item => ({ // Mapeamos para enviar solo lo necesario
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: cartTotal,
      paymentMethod,
    };

    try {
      const response = await placeOrder(orderData);

      if (response.data.status === 'success') {
        // Éxito con Contraentrega
        setNotification({ open: true, message: '¡Pedido realizado con éxito!', severity: 'success' });
        // Redirigir a una página de confirmación (la crearemos luego)
        // navigate('/pedido-confirmado');
        // Por ahora, solo limpiamos el carrito (necesitamos añadir esa función al context)
        alert('¡Pedido realizado con éxito!'); // Placeholder
      } else if (response.data.status === 'requires_payment_form') {
        // Éxito con Bold, necesitamos redirigir o mostrar el formulario
        const paymentData = response.data.payment_data;
        // Aquí iría la lógica para construir y enviar el formulario a Bold
        // Por ahora, mostramos el link (si lo devolviera) o un mensaje
        alert('Pedido recibido. Serás redirigido para el pago.');
        // window.location.href = paymentData.payment_link; // Si devolviera un link directo
        console.log("Datos para el formulario de Bold:", paymentData);
      } else {
        throw new Error(response.data.message || 'Error desconocido al procesar el pedido.');
      }

    } catch (err) {
      console.error("Error al enviar la orden:", err);
      setNotification({ open: true, message: err.response?.data?.error || err.message || 'Error al enviar el pedido.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prevState => ({ ...prevState, open: false }));
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
      <Box component="form" onSubmit={handleSubmitOrder}>
        <Typography variant="h6" gutterBottom>Datos de Envío</Typography>
        <TextField name="name" label="Nombre Completo" fullWidth margin="normal" onChange={handleInputChange} required />
        <TextField name="email" label="Correo Electrónico" type="email" fullWidth margin="normal" onChange={handleInputChange} required />
        <TextField name="address" label="Dirección de Envío" fullWidth margin="normal" onChange={handleInputChange} required />
        <TextField name="phone" label="Teléfono" fullWidth margin="normal" onChange={handleInputChange} required />

        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">Método de Pago</FormLabel>
          <RadioGroup row name="paymentMethod" value={paymentMethod} onChange={handlePaymentMethodChange}>
            <FormControlLabel value="CONTRAENTREGA" control={<Radio />} label="Pago Contraentrega" />
            <FormControlLabel value="BOLD" control={<Radio />} label="Pagar con Bold (Tarjetas, PSE, etc.)" />
          </RadioGroup>
        </FormControl>

        <Typography variant="h6" sx={{ mt: 3 }}>
          Total a Pagar: ${new Intl.NumberFormat('es-CO').format(cartTotal)}
        </Typography>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Realizar Pedido'}
        </Button>
      </Box>

      {/* Notificación */}
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
// Necesitamos importar Link para el botón de "Volver a la tienda"
import { Link } from 'react-router-dom';
export default CheckoutPage;