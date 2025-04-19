"use client";

import { useState, useEffect } from "react";
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
  Home,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";

export default function RetailerLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const { logout, user, mongoUser } = useAuth();

  // Mock notifications data - in a real app, this would come from an API
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        message: "New order received",
        time: "5 minutes ago",
        read: false,
      },
      { id: 2, message: "Product stock low", time: "1 hour ago", read: false },
      {
        id: 3,
        message: "New review on your shop",
        time: "2 hours ago",
        read: true,
      },
    ]);
  }, []);

  const menuItems = [
    {
      title: "Dashboard",
      path: "/retailer",
      icon: <Home className="w-5 h-5 mr-3" />,
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
          className="p-2 rounded-md bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 z-30 transition duration-200 ease-in-out md:flex md:flex-col md:justify-between md:w-64 bg-white border-r border-gray-200 shadow-sm`}
        style={{ height: "100vh", overflowY: "auto" }}
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
                  pathname === item.path ||
                  (item.path !== "/retailer" && pathname.startsWith(item.path))
                    ? "bg-emerald-50 text-emerald-700 font-medium shadow-sm"
                    : "hover:bg-gray-50 hover:text-emerald-600 transition-colors"
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
            className="flex items-center w-full px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content area with top navbar */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {menuItems.find(
                  (item) =>
                    pathname === item.path ||
                    (item.path !== "/retailer" &&
                      pathname.startsWith(item.path))
                )?.title || "Dashboard"}
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {mongoUser?.displayName || "Retailer"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-medium">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 border-l-2 ${
                              notification.read
                                ? "border-transparent"
                                : "border-emerald-500"
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <button className="text-xs text-emerald-600 hover:text-emerald-700">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 rounded-full hover:bg-gray-100 p-1 pr-2"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    {mongoUser?.photoURL ? (
                      <Image
                        src={mongoUser.photoURL}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                    <Link
                      href="/retailer/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Account Settings
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      My Profile
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content - fixing overflow issue */}
        <main className="flex-1 p-6 bg-gray-50" style={{ overflowY: "auto" }}>
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
