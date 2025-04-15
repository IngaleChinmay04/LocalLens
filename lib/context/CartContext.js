"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          // Ensure cart is always an array
          setCart(Array.isArray(parsedCart) ? parsedCart : []);
        } catch (error) {
          console.error("Error parsing cart data:", error);
          setCart([]);
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && Array.isArray(cart)) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product) => {
    if (!product) return;

    setCart((prevCart) => {
      // Guard against non-array cart
      if (!Array.isArray(prevCart)) prevCart = [];

      // Check if product already exists in cart
      const existingItem = prevCart.find(
        (item) => item.id === product.id || item._id === product._id
      );
      const productId = product.id || product._id;

      if (existingItem) {
        // If quantity would exceed available stock, don't add more
        if (existingItem.quantity >= product.availableQuantity) {
          return prevCart;
        }

        // Update quantity of existing item
        return prevCart.map((item) =>
          item.id === productId || item._id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, { ...product, id: productId, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    if (!productId) return;

    setCart((prevCart) => {
      // Guard against non-array cart
      if (!Array.isArray(prevCart)) return [];

      // Find the item
      const existingItem = prevCart.find(
        (item) => item.id === productId || item._id === productId
      );

      if (existingItem && existingItem.quantity > 1) {
        // Decrease quantity if more than 1
        return prevCart.map((item) =>
          item.id === productId || item._id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        // Remove item completely if quantity would be 0
        return prevCart.filter(
          (item) => item.id !== productId && item._id !== productId
        );
      }
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartQuantity = (productId) => {
    if (!Array.isArray(cart) || !productId) return 0;
    const item = cart.find(
      (item) => item.id === productId || item._id === productId
    );
    return item ? item.quantity : 0;
  };

  const getTotalCartItems = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getTotalPrice = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => {
      const price = item.basePrice || item.price || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        clearCart,
        getCartQuantity,
        getTotalCartItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
