"use client";

import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function RetailerDashboard() {
  const { user, mongoUser } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
  });

  useEffect(() => {
    // In a real application, you would fetch these stats from your API
    // This is just a placeholder
    setStats({
      products: 24,
      orders: 156,
      revenue: 8976.5,
    });
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Retailer Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-1">Products</h3>
            <p className="text-3xl font-bold">{stats.products}</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-1">Orders</h3>
            <p className="text-3xl font-bold">{stats.orders}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-1">Revenue</h3>
            <p className="text-3xl font-bold">₹{stats.revenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/retailer/products"
                className="block bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-medium">Manage Products</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, or remove products
                </p>
              </Link>

              <Link
                href="/retailer/orders"
                className="block bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-medium">View Orders</h3>
                <p className="text-sm text-gray-600">
                  Process and manage customer orders
                </p>
              </Link>

              <Link
                href="/retailer/analytics"
                className="block bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-medium">Analytics</h3>
                <p className="text-sm text-gray-600">
                  View sales performance metrics
                </p>
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
            <p className="text-gray-600">No recent orders to display.</p>

            <div className="mt-4">
              <Link
                href="/retailer/orders"
                className="text-emerald-600 hover:underline"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
