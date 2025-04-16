"use client";

import { useEffect } from "react";
import { CartProvider as BaseCartProvider } from "@/lib/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";

export default function ClientProviders({ children }) {
  return (
    <BaseCartProvider>
      <CartDrawer />
      {children}
    </BaseCartProvider>
  );
}
