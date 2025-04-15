"use client";

import { CartProvider } from "@/lib/context/CartContext";

export default function ClientProviders({ children }) {
  return <CartProvider>{children}</CartProvider>;
}
