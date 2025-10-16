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

export const createProduct = (productData) => {
  // Usamos el endpoint de administrador
  return apiClient.post('/admin/products', productData);
};

// Función para actualizar un producto por su ID
export const updateProduct = (productId, productData) => {
  return apiClient.put(`/admin/products/${productId}`, productData);
};

// Función para eliminar un producto por su ID
export const deleteProduct = (productId) => {
  return apiClient.delete(`/admin/products/${productId}`);
};

// --- AÑADE ESTA NUEVA FUNCIÓN ---
export const getProductById = (productId) => {
  return apiClient.get(`/products/${productId}`);
};