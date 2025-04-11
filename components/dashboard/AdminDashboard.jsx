"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ShoppingBag,
  Store,
  Package,
  Clock,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: {
      total: 0,
      customers: 0,
      retailers: 0,
    },
    shops: {
      total: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
    },
    products: {
      total: 0,
    },
    orders: {
      total: 0,
      pendingDelivery: 0,
    },
    recentShops: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { getIdToken } = useAuth();
  // Add these functions before the return statement

  const handleApproveShop = async (shopId) => {
    try {
      const token = await getIdToken();

      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/admin/shops/${shopId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve shop");
      }

      // Update local state to remove the approved shop from the list
      setStats((prevStats) => ({
        ...prevStats,
        recentShops: prevStats.recentShops.filter(
          (shop) => shop._id !== shopId
        ),
        shops: {
          ...prevStats.shops,
          pending: prevStats.shops.pending - 1,
          verified: prevStats.shops.verified + 1,
          total: prevStats.shops.total, // total stays the same
        },
      }));
    } catch (error) {
      console.error("Error approving shop:", error);
      alert("Failed to approve shop. Please try again.");
    }
  };

  const handleRejectShop = async (shopId) => {
    try {
      const token = await getIdToken();

      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/admin/shops/${shopId}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reject shop");
      }

      // Update local state to remove the rejected shop from the list
      setStats((prevStats) => ({
        ...prevStats,
        recentShops: prevStats.recentShops.filter(
          (shop) => shop._id !== shopId
        ),
        shops: {
          ...prevStats.shops,
          pending: prevStats.shops.pending - 1,
          rejected: prevStats.shops.rejected + 1,
          total: prevStats.shops.total, // total stays the same
        },
      }));
    } catch (error) {
      console.error("Error rejecting shop:", error);
      alert("Failed to reject shop. Please try again.");
    }
  };
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Get Firebase token
        const token = await getIdToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const response = await fetch("/api/admin/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`, // Add the token to your request
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const apiData = await response.json();

        console.log("API Data:", apiData); // Debugging line

        // Transform the API data to match your component's expected format
        setStats({
          users: {
            total: apiData.userMetrics.total || 0,
            customers: apiData.userMetrics.customers || 0,
            retailers: apiData.userMetrics.retailers || 0,
          },
          shops: {
            total: apiData.shopMetrics.total || 0,
            pending: apiData.shopMetrics.pending || 0,
            verified: apiData.shopMetrics.verified || 0,
            rejected: apiData.shopMetrics.rejected || 0,
          },
          products: {
            total: apiData.productMetrics?.total || 0, // This isn't in your current API
          },
          orders: {
            total: apiData.orderMetrics.total || 0,
            pendingDelivery: apiData.orderMetrics.processing || 0,
          },
          recentShops: apiData.recentShops || [], // This isn't in your current API
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of the LocalLens platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.users.total}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-blue-600 font-medium">
              {stats.users.customers}
            </span>{" "}
            customers,{" "}
            <span className="text-purple-600 font-medium">
              {stats.users.retailers}
            </span>{" "}
            retailers
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Shops</p>
              <h3 className="text-2xl font-bold">{stats.shops.total}</h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Store className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-amber-600 font-medium">
              {stats.shops.pending}
            </span>{" "}
            pending approval
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <h3 className="text-2xl font-bold">{stats.products.total}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Across all verified shops
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Orders</p>
              <h3 className="text-2xl font-bold">{stats.orders.total}</h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-amber-600 font-medium">
              {stats.orders.pendingDelivery}
            </span>{" "}
            pending delivery
          </div>
        </div>
      </div>

      {/* Pending Shop Approvals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium">Pending Shop Approvals</h2>
            <Link
              href="/admin/shops"
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div>
            {stats.recentShops.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No shops pending approval
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentShops.map((shop) => (
                  <div key={shop._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden">
                          {shop.logo ? (
                            <img
                              src={shop.logo}
                              alt={shop.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Store className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-900">
                            {shop.name}
                          </h3>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Submitted{" "}
                            {new Date(shop.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveShop(shop._id)}
                          className="text-white bg-emerald-600 hover:bg-emerald-700 rounded-md px-2 py-1 text-xs font-medium flex items-center"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectShop(shop._id)}
                          className="text-white bg-red-600 hover:bg-red-700 rounded-md px-2 py-1 text-xs font-medium flex items-center"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Other dashboard sections here */}
      </div>
    </div>
  );
}
