"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Store,
  ShoppingBag,
  Package,
  ClipboardList,
  BarChart2,
  Settings,
  Menu,
  X,
  LogOut,
  Star,
  TrendingUp,
} from "lucide-react";

export default function RetailerLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/retailer",
      icon: <Store className="w-5 h-5 mr-3" />,
    },
    {
      title: "My Shops",
      path: "/retailer/shops",
      icon: <Store className="w-5 h-5 mr-3" />,
    },
    {
      title: "All Products",
      path: "/retailer/products",
      icon: <Package className="w-5 h-5 mr-3" />,
    },
    {
      title: "Featured Products",
      path: "/retailer/products?filter=featured",
      icon: <Star className="w-5 h-5 mr-3" />,
    },
    {
      title: "Trending Products",
      path: "/retailer/products?filter=trending",
      icon: <TrendingUp className="w-5 h-5 mr-3" />,
    },
    {
      title: "Orders",
      path: "/retailer/orders",
      icon: <ShoppingBag className="w-5 h-5 mr-3" />,
    },
    {
      title: "Reservations",
      path: "/retailer/reservations",
      icon: <ClipboardList className="w-5 h-5 mr-3" />,
    },
    {
      title: "Analytics",
      path: "/retailer/analytics",
      icon: <BarChart2 className="w-5 h-5 mr-3" />,
    },
    {
      title: "Settings",
      path: "/retailer/settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-emerald-600 text-white"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 z-30 transition duration-200 ease-in-out md:flex md:flex-col md:justify-between md:w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto`}
      >
        <div className="p-6">
          <Link href="/retailer" className="flex items-center mb-8">
            <span className="text-2xl font-bold text-emerald-600">
              LocalLens
            </span>
            <span className="ml-2 text-sm font-medium bg-emerald-100 text-emerald-800 py-1 px-2 rounded">
              Retailer
            </span>
          </Link>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-3 text-gray-700 rounded-lg ${
                  pathname === item.path
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
