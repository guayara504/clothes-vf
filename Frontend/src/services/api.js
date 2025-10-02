// src/services/api.js
import axios from 'axios';

// ¡IMPORTANTE! Reemplaza esta URL con la URL de tu API Gateway
const API_URL = 'https://zxxwe9fta9.execute-api.us-east-2.amazonaws.com/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener todos los productos
export const getProducts = () => {
  return apiClient.get('/products');
};

// Aquí añadiremos más funciones (crear, actualizar, eliminar) más adelante