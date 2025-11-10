// src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Box, Button, IconButton,
  Modal, TextField, Snackbar, Alert, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para el modal y el formulario ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null); // Para guardar el producto a editar/eliminar
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // --- Estado para el diálogo de confirmación de borrado ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response.data);
    } catch (err) {
      setError('Error al cargar los productos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Manejadores para el modal ---
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentProduct({ name: '', description: '', price: '', category: '', imageUrl: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const productData = { ...currentProduct, price: Number(currentProduct.price) };

    try {
      if (isEditing) {
        await updateProduct(currentProduct.productId, productData);
        setNotification({ open: true, message: '¡Producto actualizado exitosamente!', severity: 'success' });
      } else {
        await createProduct(productData);
        setNotification({ open: true, message: '¡Producto creado exitosamente!', severity: 'success' });
      }
      handleCloseModal();
      await fetchProducts();
    } catch (err) {
      setNotification({ open: true, message: `Error al ${isEditing ? 'actualizar' : 'crear'} el producto.`, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // --- Manejadores para la eliminación ---
  const handleOpenConfirmDialog = (product) => {
    setCurrentProduct(product);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setIsConfirmOpen(false);
    setCurrentProduct(null);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(currentProduct.productId);
      setNotification({ open: true, message: 'Producto eliminado exitosamente.', severity: 'success' });
      handleCloseConfirmDialog();
      await fetchProducts();
    } catch (err) {
      setNotification({ open: true, message: 'Error al eliminar el producto.', severity: 'error' });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prevState => ({ ...prevState, open: false }));
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>Gestión de Productos</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            component={Link}
            to="/admin/orders"
            sx={{ textTransform: 'none' }}
          >
            Ver Pedidos
          </Button>
          <Button variant="contained" onClick={handleOpenCreateModal}>Nuevo Producto</Button>
        </Box>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
      {error && <Typography color="error">{error}</Typography>}

      {!loading && !error && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">${new Intl.NumberFormat('es-CO').format(product.price)}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpenEditModal(product)} color="primary"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleOpenConfirmDialog(product)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* --- Modal para Crear/Editar Producto --- */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6">{isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}</Typography>
          <TextField name="name" label="Nombre" value={currentProduct?.name || ''} onChange={handleInputChange} fullWidth margin="normal" />
          <TextField name="description" label="Descripción" value={currentProduct?.description || ''} onChange={handleInputChange} fullWidth margin="normal" />
          <TextField name="price" label="Precio" type="number" value={currentProduct?.price || ''} onChange={handleInputChange} fullWidth margin="normal" />
          <TextField name="category" label="Categoría" value={currentProduct?.category || ''} onChange={handleInputChange} fullWidth margin="normal" />
          <TextField name="imageUrl" label="URL de la Imagen" value={currentProduct?.imageUrl || ''} onChange={handleInputChange} fullWidth margin="normal" />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={24} /> : 'Guardar'}</Button>
          </Box>
        </Box>
      </Modal>

      {/* --- Diálogo de Confirmación para Eliminar --- */}
      <Dialog open={isConfirmOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro de que quieres eliminar el producto "{currentProduct?.name}"? Esta acción no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" autoFocus>Eliminar</Button>
        </DialogActions>
      </Dialog>
      
      {/* --- Notificación --- */}
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>{notification.message}</Alert>
      </Snackbar>
    </Container>
  );
}

export default ProductManagement;