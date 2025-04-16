"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [showAddedNotification, setShowAddedNotification] = useState(false);

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

  // Hide the added notification after 3 seconds
  useEffect(() => {
    if (showAddedNotification) {
      const timer = setTimeout(() => {
        setShowAddedNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAddedNotification]);

  const addToCart = (product) => {
    if (!product) return;

    // Store the last added item for notification
    setLastAddedItem(product);
    setShowAddedNotification(true);

    setCart((prevCart) => {
      // Guard against non-array cart
      if (!Array.isArray(prevCart)) prevCart = [];

      // Check if product already exists in cart
      const existingItem = prevCart.find(
        (item) =>
          item.id === product.id ||
          item._id === product._id ||
          item.productId === product.productId
      );

      const productId = product.id || product._id || product.productId;

      // Ensure product has proper image structure
      const normalizedProduct = {
        ...product,
        id: productId,
        image:
          product.image ||
          (product.images && product.images.length > 0
            ? product.images[0].url
            : null),
      };

      if (existingItem) {
        // If quantity would exceed available stock, don't add more
        if (existingItem.quantity >= (product.availableQuantity || 99)) {
          return prevCart;
        }

        // Update quantity of existing item
        return prevCart.map((item) =>
          item.id === productId ||
          item._id === productId ||
          item.productId === productId
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      } else {
        // Add new item to cart with default quantity
        return [
          ...prevCart,
          {
            ...normalizedProduct,
            quantity: product.quantity || 1,
          },
        ];
      }
    });

    // Don't automatically open cart drawer when items are added
    // Only show the notification
  };

  const removeFromCart = (productId) => {
    if (!productId) return;

    setCart((prevCart) => {
      // Guard against non-array cart
      if (!Array.isArray(prevCart)) return [];

      // Find the item
      const existingItem = prevCart.find(
        (item) =>
          item.id === productId ||
          item._id === productId ||
          item.productId === productId
      );

      if (existingItem && existingItem.quantity > 1) {
        // Decrease quantity if more than 1
        return prevCart.map((item) =>
          item.id === productId ||
          item._id === productId ||
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        // Remove item completely if quantity would be 0
        return prevCart.filter(
          (item) =>
            item.id !== productId &&
            item._id !== productId &&
            item.productId !== productId
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
      (item) =>
        item.id === productId ||
        item._id === productId ||
        item.productId === productId
    );
    return item ? item.quantity : 0;
  };

  const getTotalCartItems = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getTotalPrice = () => {
    if (!Array.isArray(cart)) return 0;
    return cart
      .reduce((total, item) => {
        const price = item.basePrice || item.price || 0;
        return total + price * (item.quantity || 1);
      }, 0)
      .toFixed(2);
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
        lastAddedItem,
        showAddedNotification,
        setShowAddedNotification,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
