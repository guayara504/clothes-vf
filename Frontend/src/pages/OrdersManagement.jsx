// src/pages/OrdersManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders } from '../services/api';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';

function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      setOrders(response.data.data || []);
    } catch (err) {
      setError('Error al cargar los pedidos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROCESANDO':
        return 'info';
      case 'PENDIENTE':
        return 'warning';
      case 'COMPLETADO':
        return 'success';
      case 'FALLIDO':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAGADO':
        return 'success';
      case 'PENDIENTE_PAGO':
        return 'warning';
      case 'PENDIENTE':
        return 'warning';
      case 'FALLIDO':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShoppingBagIcon sx={{ fontSize: 40, color: '#667eea' }} />
          <Typography variant="h4" gutterBottom>
            Gestión de Pedidos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            component={Link}
            to="/admin/products"
            sx={{ textTransform: 'none' }}
          >
            Gestión de Productos
          </Button>
          <Chip 
            label={`${orders.length} pedidos`} 
            color="primary" 
            sx={{ fontSize: '1rem', py: 2.5 }}
          />
        </Box>
      </Box>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingBagIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay pedidos registrados
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID Pedido</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Método Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow 
                  key={order.orderId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleOrderClick(order)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {order.orderId.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{order.customerDetails?.name || 'N/A'}</TableCell>
                  <TableCell>{order.customerDetails?.email || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${new Intl.NumberFormat('es-CO').format(order.totalAmount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.paymentMethod || 'N/A'} 
                      size="small"
                      color={order.paymentMethod === 'MERCADOPAGO' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.orderStatus || 'N/A'} 
                      size="small"
                      color={getStatusColor(order.orderStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.paymentStatus || 'N/A'} 
                      size="small"
                      color={getPaymentStatusColor(order.paymentStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderClick(order);
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo de Detalles del Pedido */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingBagIcon sx={{ color: '#667eea' }} />
            <Typography variant="h6">
              Detalles del Pedido
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={3}>
                {/* Información del Pedido */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Información del Pedido
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">ID Pedido:</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {selectedOrder.orderId}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Fecha:</Typography>
                          <Typography variant="body2">
                            {formatDate(selectedOrder.createdAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Chip 
                            label={selectedOrder.orderStatus || 'N/A'} 
                            color={getStatusColor(selectedOrder.orderStatus)}
                            size="small"
                          />
                          <Chip 
                            label={selectedOrder.paymentStatus || 'N/A'} 
                            color={getPaymentStatusColor(selectedOrder.paymentStatus)}
                            size="small"
                          />
                          <Chip 
                            label={selectedOrder.paymentMethod || 'N/A'} 
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Información del Cliente */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Información del Cliente
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {selectedOrder.customerDetails?.email || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedOrder.customerDetails?.name || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {selectedOrder.customerDetails?.phone || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <HomeIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
                          <Typography variant="body2">
                            {selectedOrder.customerDetails?.address || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Resumen del Pedido */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Resumen del Pedido
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Items:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedOrder.items?.length || 0}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Total:
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                            ${new Intl.NumberFormat('es-CO').format(selectedOrder.totalAmount || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Items del Pedido */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Productos
                      </Typography>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {selectedOrder.items.map((item, index) => (
                            <Box 
                              key={index}
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1.5,
                                backgroundColor: 'grey.50',
                                borderRadius: 1
                              }}
                            >
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {item.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Cantidad: {item.quantity} × ${new Intl.NumberFormat('es-CO').format(item.price || 0)}
                                </Typography>
                              </Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                ${new Intl.NumberFormat('es-CO').format((item.price || 0) * (item.quantity || 1))}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No hay items en este pedido
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default OrdersManagement;

