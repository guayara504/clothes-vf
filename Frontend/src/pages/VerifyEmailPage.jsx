import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EmailIcon from '@mui/icons-material/Email';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener el email de la ubicación, del estado, o del localStorage
  const emailFromState = location.state?.email || '';
  const emailFromStorage = localStorage.getItem('pendingVerificationEmail') || '';
  const email = emailFromState || emailFromStorage || emailInput;
  
  // Guardar el email en localStorage si viene del state
  React.useEffect(() => {
    if (emailFromState) {
      localStorage.setItem('pendingVerificationEmail', emailFromState);
    }
  }, [emailFromState]);
  
  // Limpiar el email del localStorage cuando se verifica exitosamente
  React.useEffect(() => {
    if (success) {
      localStorage.removeItem('pendingVerificationEmail');
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code || code.length !== 6) {
      setError('Por favor ingresa el código de 6 dígitos');
      return;
    }

    const emailToUse = email || emailInput;
    if (!emailToUse) {
      setError('Por favor ingresa tu email');
      return;
    }

    setLoading(true);

    try {
      await confirmSignUp({ username: emailToUse, confirmationCode: code });
      setSuccess(true);
      // Limpiar el email del localStorage
      localStorage.removeItem('pendingVerificationEmail');
      setTimeout(() => {
        navigate('/login', { 
          replace: true,
          state: { 
            message: 'Email verificado exitosamente. Ahora puedes iniciar sesión.' 
          } 
        });
      }, 2000);
    } catch (err) {
      console.error('Error al verificar:', err);
      setError(err.message || 'Error al verificar el código. Por favor, verifica el código e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const emailToUse = email || emailInput;
    if (!emailToUse) {
      setError('Por favor ingresa tu email primero');
      return;
    }

    setResending(true);
    setError('');

    try {
      await resendSignUpCode({ username: emailToUse });
      alert('Código de verificación reenviado. Por favor, revisa tu correo electrónico.');
    } catch (err) {
      console.error('Error al reenviar:', err);
      setError(err.message || 'Error al reenviar el código');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <VerifiedUserIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#4caf50' }}>
            ¡Email Verificado!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Tu cuenta ha sido verificada exitosamente. Redirigiendo al inicio de sesión...
          </Typography>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <EmailIcon sx={{ fontSize: 50, color: '#667eea', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Verificar Email
          </Typography>
          {location.state?.message && (
            <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
              {location.state.message}
            </Alert>
          )}
          {email ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Ingresa el código de verificación que enviamos a
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 1, color: '#667eea' }}>
                {email}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ingresa tu email y el código de verificación que enviamos
              </Typography>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />
            </>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Código de Verificación"
            value={code}
            onChange={handleCodeChange}
            margin="normal"
            required
            inputProps={{
              maxLength: 6,
              style: { 
                textAlign: 'center', 
                fontSize: '24px', 
                letterSpacing: '8px',
                fontWeight: 'bold'
              }
            }}
            placeholder="000000"
            helperText="Ingresa el código de 6 dígitos"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !code || code.length !== 6 || (!email && !emailInput)}
            sx={{
              mt: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a4290 100%)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Verificar Email'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Button
            variant="text"
            onClick={handleResendCode}
            disabled={resending || (!email && !emailInput)}
            sx={{ color: '#667eea' }}
          >
            {resending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Reenviando...
              </>
            ) : (
              '¿No recibiste el código? Reenviar'
            )}
          </Button>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="center">
          <Typography variant="body2" color="text.secondary">
            ¿Ya verificaste tu cuenta?
          </Typography>
          <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
            Inicia Sesión
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}

export default VerifyEmailPage;

