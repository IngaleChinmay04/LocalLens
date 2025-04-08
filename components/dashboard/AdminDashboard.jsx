"use client";

import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const { user, mongoUser } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    retailers: 0,
    products: 0,
  });

  useEffect(() => {
    // In a real application, you would fetch these stats from your API
    // This is just a placeholder
    setStats({
      users: 324,
      retailers: 42,
      products: 1256,
    });
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-1">Total Users</h3>
            <p className="text-3xl font-bold">{stats.users}</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-1">Retailers</h3>
            <p className="text-3xl font-bold">{stats.retailers}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-1">Products</h3>
            <p className="text-3xl font-bold">{stats.products}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="block bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-medium">Manage Users</h3>
                <p className="text-sm text-gray-600">
                  View, edit, or delete user accounts
                </p>
              </Link>

              <Link
                href="/admin/retailers"
                className="block bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-medium">Manage Retailers</h3>
                <p className="text-sm text-gray-600">
                  Approve and manage retailer accounts
                </p>
              </Link>

              <Link
                href="/admin/categories"
                className="block bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-medium">Manage Categories</h3>
                <p className="text-sm text-gray-600">
                  Add or edit product categories
                </p>
              </Link>

              <Link
                href="/admin/settings"
                className="block bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-medium">System Settings</h3>
                <p className="text-sm text-gray-600">
                  Configure application settings
                </p>
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
            <p className="text-gray-600">No recent activity to display.</p>

            <div className="mt-4">
              <Link
                href="/admin/activity"
                className="text-emerald-600 hover:underline"
              >
                View All Activity
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
