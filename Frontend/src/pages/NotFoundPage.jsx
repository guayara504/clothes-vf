// src/pages/NotFoundPage.jsx
import React from 'react';
import { Container, Typography } from '@mui/material';

function NotFoundPage() {
  return (
    <Container sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h1">404</Typography>
      <Typography variant="h4">Página no encontrada</Typography>
    </Container>
  );
}

export default NotFoundPage;