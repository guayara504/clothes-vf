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
import LoginIcon from '@mui/icons-material/Login';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        // Si el error indica que el usuario no está verificado, redirigir a verificación
        if (result.error && (result.error.includes('not confirmed') || result.error.includes('verifica'))) {
          localStorage.setItem('pendingVerificationEmail', email);
          navigate('/verify-email', { 
            state: { 
              email,
              message: result.error 
            } 
          });
        } else {
          setError(result.error || 'Error al iniciar sesión');
        }
      }
    } catch (err) {
      // Si el error indica que el usuario no está verificado, redirigir a verificación
      if (err.message && (err.message.includes('not confirmed') || err.message.includes('verifica'))) {
        localStorage.setItem('pendingVerificationEmail', email);
        navigate('/verify-email', { 
          state: { 
            email,
            message: err.message 
          } 
        });
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LoginIcon sx={{ fontSize: 50, color: '#667eea', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Iniciar Sesión
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ingresa a tu cuenta para ver tus pedidos y estados
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
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
            ¿No tienes cuenta?
          </Typography>
          <Link to="/register" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
            Regístrate
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default LoginPage;

