// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // <-- 1. IMPORTAR
import { getProducts } from '../services/api';
import {
  Container, Typography, Grid, Card, CardContent, CardMedia,
  CircularProgress, Box, CardActionArea
} from '@mui/material';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    fetchProducts();
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        Clothes VF
      </Typography>
      <Typography variant="h5" align="center" color="text.secondary" paragraph>
        Tu estilo, tu esencia.
      </Typography>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
      {error && <Typography color="error" align="center">{error}</Typography>}

      {!loading && !error && (
      <Grid container spacing={4}>
        {products.map((product) => (
          <Grid item key={product.productId} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              {/* LA CORRECCIÓN ESTÁ AQUÍ: 
                Le decimos a CardActionArea que actúe como un Link.
              */}
              <CardActionArea component={Link} to={`/product/${product.productId}`}>
                <CardMedia
                  component="img"
                  height="240"
                  image={product.imageUrl || 'https://via.placeholder.com/300x200'}
                  alt={product.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    ${new Intl.NumberFormat('es-CO').format(product.price)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}
    </Container>
  );
}

export default HomePage;