"use client";

import { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/context/CartContext";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalCartItems,
    getTotalPrice,
    lastAddedItem,
    showAddedNotification,
    setShowAddedNotification,
    setCart,
  } = useCart();

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isCartOpen]);

  // Add animation styles for the cart notification
  useEffect(() => {
    // Add animation for notification
    const styles = document.createElement("style");
    styles.innerHTML = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .animate-slide-in-right {
        animation: slideInRight 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(styles);

    // Cleanup function to remove the style element when component unmounts
    return () => {
      if (styles.parentNode) {
        styles.parentNode.removeChild(styles);
      }
    };
  }, []);

  return (
    <>
      {/* Cart Overlay - blurred background instead of black overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Add to Cart Notification */}
      {showAddedNotification && lastAddedItem && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 flex items-start space-x-3 max-w-xs animate-slide-in-right">
          <CheckCircle className="text-emerald-500 h-5 w-5 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Added to cart!</h4>
            <p className="text-xs text-gray-500 mb-2 mt-1 line-clamp-1">
              {lastAddedItem.name}
            </p>
            <button
              onClick={() => {
                setShowAddedNotification(false);
                setIsCartOpen(true);
              }}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              View cart
            </button>
          </div>
          <button
            onClick={() => setShowAddedNotification(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        } shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-emerald-600" />
              <h2 className="text-lg font-medium">
                Your Cart ({getTotalCartItems()})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div
                    key={item.id || item._id || item.productId}
                    className="p-4 flex hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden mr-4 relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : item.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0].url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">
                            No image
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => {
                            // Remove item completely
                            setCart((prevCart) =>
                              prevCart.filter(
                                (cartItem) =>
                                  cartItem.id !== item.id &&
                                  cartItem._id !== item._id &&
                                  cartItem.productId !== item.productId
                              )
                            );
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.variant && (
                        <p className="text-xs text-gray-700 mt-1">
                          Variant: {item.variant}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mb-2">
                        {item.shopName || "Local Shop"}
                      </p>

                      <div className="flex justify-between items-center">
                        <div className="font-medium text-emerald-600">
                          ₹{item.price}
                        </div>

                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              removeFromCart(
                                item.id || item._id || item.productId
                              )
                            }
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1 text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200"
                            disabled={
                              item.quantity >= (item.availableQuantity || 99)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4 text-center">
                  Your cart is empty
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">₹{getTotalPrice()}</span>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Delivery charges and taxes calculated at checkout
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => clearCart()}
                  className="py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Clear Cart
                </button>
                <Link
                  href="/checkout"
                  className="py-2 bg-emerald-600 text-white text-center rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
