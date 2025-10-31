// src/components/Cart.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- IMPORTAR
import { useCart } from '../context/CartContext';
import {
  Drawer, Box, Typography, List, ListItem, ListItemText,
  IconButton, Divider, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function Cart({ open, onClose }) {
  const { cartItems, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate(); // <-- Hook para navegar

  const handleCheckout = () => {
    onClose(); // Cierra el carrito
    navigate('/checkout'); // Navega a la página de checkout
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 2 }} role="presentation">
        <Typography variant="h5" component="div" gutterBottom>
          Tu Carrito
        </Typography>
        <Divider />
        {cartItems.length === 0 ? (
          <Typography sx={{ mt: 2 }}>Tu carrito está vacío.</Typography>
        ) : (
          <List>
            {cartItems.map((item) => (
              <ListItem
                key={item.productId}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => removeFromCart(item.productId)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={item.name}
                  secondary={`Cantidad: ${item.quantity} - $${new Intl.NumberFormat('es-CO').format(item.price * item.quantity)}`}
                />
              </ListItem>
            ))}
            <Divider sx={{ my: 2 }} />
            <ListItem>
              <ListItemText
                primary={<Typography variant="h6">Total</Typography>}
                secondary={<Typography variant="h6">${new Intl.NumberFormat('es-CO').format(cartTotal)}</Typography>}
              />
            </ListItem>
          </List>
        )}
        {cartItems.length > 0 && (
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleCheckout} // <-- CONECTAR EL BOTÓN
            >
                Ir a Pagar
            </Button>
        )}
      </Box>
    </Drawer>
  );
}

export default Cart;