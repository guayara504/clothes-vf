// src/context/CartContext.jsx
import React, { createContext, useState, useContext } from 'react';

// 1. Creamos el "Contexto" (la pizarra)
const CartContext = createContext();

// 2. Creamos un "hook" personalizado para usar el contexto fácilmente
export const useCart = () => {
  return useContext(CartContext);
};

// 3. Creamos el "Proveedor" del contexto. Este componente envolverá nuestra aplicación
//    y le dará acceso a todo lo relacionado con el carrito.
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      // Revisa si el producto ya está en el carrito
      const existingItem = prevItems.find(item => item.productId === product.productId);
      if (existingItem) {
        // Si ya existe, incrementa la cantidad
        return prevItems.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Si es nuevo, lo añade con cantidad 1
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  // Aquí añadiremos más funciones como removeFromCart, clearCart, etc.

  const value = {
    cartItems,
    addToCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};