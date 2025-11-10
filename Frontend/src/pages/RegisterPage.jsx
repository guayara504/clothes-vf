import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.email, formData.password, formData.email, {
        name: formData.name,
      });
      if (result.success) {
        setError('');
        // Guardar email en localStorage para la página de verificación
        localStorage.setItem('pendingVerificationEmail', formData.email);
        // Redirigir a la página de verificación
        navigate('/verify-email', { 
          replace: true,
          state: { 
            email: formData.email,
            message: 'Registro exitoso. Por favor, verifica tu email con el código que te enviamos.'
          } 
        });
      } else {
        setError(result.error || 'Error al registrarse');
      }
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Error al registrarse con Google');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <PersonAddIcon sx={{ fontSize: 50, color: '#667eea', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Crear Cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Únete a Clothes VF y gestiona tus pedidos
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Nombre completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
          />
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            helperText="Mínimo 8 caracteres"
          />
          <TextField
            fullWidth
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a4290 100%)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear Cuenta'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            O continúa con
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{
            py: 1.5,
            mb: 3,
            borderColor: '#4285F4',
            color: '#4285F4',
            '&:hover': {
              borderColor: '#4285F4',
              backgroundColor: 'rgba(66, 133, 244, 0.04)',
            },
          }}
        >
          Continuar con Google
        </Button>

        <Stack direction="row" spacing={1} justifyContent="center">
          <Typography variant="body2" color="text.secondary">
            ¿Ya tienes cuenta?
          </Typography>
          <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
            Inicia Sesión
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default RegisterPage;

