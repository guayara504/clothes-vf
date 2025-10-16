// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductById } from '../services/api';
import {
  Container, Typography, Box, CircularProgress, Card, CardMedia, CardContent, Button
} from '@mui/material';

function ProductDetailPage() {
  // useParams() nos da acceso a los parámetros de la URL, como ':productId'
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(productId);
        setProduct(response.data);
      } catch (err) {
        setError('Error al cargar el producto.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]); // Se ejecuta cada vez que el productId de la URL cambia

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" align="center">{error}</Typography>;
  }

  if (!product) {
    return <Typography align="center">Producto no encontrado.</Typography>;
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <CardMedia
          component="img"
          sx={{ width: { xs: '100%', md: 400 } }}
          image={product.imageUrl || 'https://via.placeholder.com/400x400'}
          alt={product.name}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <CardContent>
            <Typography component="h1" variant="h3" gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="h5" color="primary" paragraph>
              ${new Intl.NumberFormat('es-CO').format(product.price)}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button variant="contained" size="large">
                Añadir al Carrito
              </Button>
            </Box>
          </CardContent>
        </Box>
      </Card>
    </Container>
  );
}

export default ProductDetailPage;