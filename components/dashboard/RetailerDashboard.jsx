"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import {
  Store,
  ShoppingBag,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  Package,
  AlertCircle,
  CheckCircle,
  Truck,
  DollarSign,
  BarChart2,
  MapPin,
} from "lucide-react";
import ShopStatusBanner from "@/components/retailers/ShopStatusBanner";
import { getAuth } from "firebase/auth"; // Import Firebase directly

export default function RetailerDashboard() {
  const { user, mongoUser, getIdToken } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    shops: {
      total: 0,
      verified: 0,
      pending: 0,
    },
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
    },
    reservations: {
      total: 0,
      pending: 0,
      confirmed: 0,
      ready: 0,
    },
    products: {
      total: 0,
      lowStock: 0,
    },
    revenue: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    },
    recentActivity: [],
    topProducts: [],
    nearbyCustomers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());
  // const { user, getIdToken } = useAuth();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        // Get Firebase token
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error("No user is signed in");
        }

        // Get token directly from Firebase
        const token = await currentUser.getIdToken(true);
        console.log(
          "Firebase token retrieved:",
          token ? "Yes (valid token)" : "No"
        );

        const response = await fetch("/api/retailers/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        console.log("Dashboard data:", data);
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {mongoUser?.displayName || "Retailer"}
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your shops today -{" "}
            {formatDate(currentDate)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/retailer/products/new"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
          >
            Add Product
          </Link>
          <Link
            href="/retailer/shops/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Register Shop
          </Link>
        </div>
      </div>

      {/* Shop Status Banner */}
      <ShopStatusBanner />

      {/* Shop Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shops</p>
              <h3 className="text-2xl font-bold">
                {dashboardData.shops.total}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-green-600 font-medium">
              {dashboardData.shops.verified}
            </span>{" "}
            verified,{" "}
            <span className="text-amber-600 font-medium">
              {dashboardData.shops.pending}
            </span>{" "}
            pending
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold">
                {dashboardData.orders.total}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-amber-600 font-medium">
              {dashboardData.orders.pending}
            </span>{" "}
            pending,{" "}
            <span className="text-blue-600 font-medium">
              {dashboardData.orders.processing}
            </span>{" "}
            processing
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Reservations</p>
              <h3 className="text-2xl font-bold">
                {dashboardData.reservations.total}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-amber-600 font-medium">
              {dashboardData.reservations.pending}
            </span>{" "}
            pending,{" "}
            <span className="text-indigo-600 font-medium">
              {dashboardData.reservations.ready}
            </span>{" "}
            ready
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(dashboardData.revenue.total)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-green-600 font-medium">
              {formatCurrency(dashboardData.revenue.today)}
            </span>{" "}
            today,{" "}
            <span className="text-blue-600 font-medium">
              {formatCurrency(dashboardData.revenue.thisWeek)}
            </span>{" "}
            this week
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Recent Activity</h2>
              <Link
                href="/retailer/analytics"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboardData.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No recent activity
              </div>
            ) : (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div
                      className={`p-2 rounded-full mr-3 ${
                        activity.type === "order"
                          ? "bg-purple-100"
                          : activity.type === "reservation"
                          ? "bg-amber-100"
                          : activity.type === "shop"
                          ? "bg-blue-100"
                          : activity.type === "product"
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {activity.type === "order" ? (
                        <ShoppingBag className="h-4 w-4 text-purple-600" />
                      ) : activity.type === "reservation" ? (
                        <Calendar className="h-4 w-4 text-amber-600" />
                      ) : activity.type === "shop" ? (
                        <Store className="h-4 w-4 text-blue-600" />
                      ) : activity.type === "product" ? (
                        <Package className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        {activity.message}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(activity.timestamp)}{" "}
                          {formatTime(activity.timestamp)}
                        </p>
                        {activity.link && (
                          <Link
                            href={activity.link}
                            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center"
                          >
                            View <ChevronRight className="h-3 w-3 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats & Links */}
        <div className="space-y-6">
          {/* Sales Trends */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium mb-3">Sales Trends</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Today</span>
                  <span className="font-medium">
                    {formatCurrency(dashboardData.revenue.today)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (dashboardData.revenue.today /
                          dashboardData.revenue.thisWeek) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">This Week</span>
                  <span className="font-medium">
                    {formatCurrency(dashboardData.revenue.thisWeek)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (dashboardData.revenue.thisWeek /
                          dashboardData.revenue.thisMonth) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">This Month</span>
                  <span className="font-medium">
                    {formatCurrency(dashboardData.revenue.thisMonth)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/retailer/analytics"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-end"
              >
                View Detailed Analytics{" "}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Product Inventory Alert */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-medium">Inventory Alerts</h2>
              <div className="p-1.5 bg-red-100 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            {dashboardData.products.lowStock > 0 ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {dashboardData.products.lowStock} products are low on
                      stock
                    </p>
                    <div className="mt-2">
                      <Link
                        href="/retailer/products?filter=lowStock"
                        className="text-xs font-medium text-red-700 hover:text-red-600 flex items-center"
                      >
                        View products <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      All products have adequate stock levels
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                <span className="font-medium">
                  {dashboardData.products.total}
                </span>{" "}
                total products in inventory
              </p>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-medium">Location Insights</h2>
              <div className="p-1.5 bg-emerald-100 rounded-full">
                <MapPin className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-emerald-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">
                      {dashboardData.nearbyCustomers || "N/A"}
                    </span>{" "}
                    potential customers nearby
                  </p>
                  <p className="text-xs text-gray-500">
                    Within 5km of your shops
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">
                      {dashboardData.orders.pending +
                        dashboardData.orders.processing}
                    </span>{" "}
                    orders to fulfill
                  </p>
                  <p className="text-xs text-gray-500">In your service area</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/retailer/shops"
            className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Manage Shops</h3>
                <p className="text-xs text-gray-500">
                  View and manage all your registered shops
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/products"
            className="block p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium">Products</h3>
                <p className="text-xs text-gray-500">
                  Manage your inventory and product listings
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/orders"
            className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Process Orders</h3>
                <p className="text-xs text-gray-500">
                  View and process customer orders
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/reservations"
            className="block p-3 bg-amber-50 hover:bg-amber-100 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium">Reservations</h3>
                <p className="text-xs text-gray-500">
                  Manage pre-bookings and reservations
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/analytics"
            className="block p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium">Analytics</h3>
                <p className="text-xs text-gray-500">
                  View performance metrics and reports
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/products/new"
            className="block p-3 bg-pink-50 hover:bg-pink-100 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg mr-3">
                <div className="h-5 w-5 text-pink-600 flex items-center justify-center font-bold">
                  +
                </div>
              </div>
              <div>
                <h3 className="font-medium">Add New Product</h3>
                <p className="text-xs text-gray-500">
                  Create a new product listing
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Top Products */}
      {dashboardData.topProducts && dashboardData.topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Top Selling Products</h2>
              <Link
                href="/retailer/analytics"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.topProducts.slice(0, 4).map((product, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 flex-shrink-0 mr-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{product.quantity} sold</span>
                    <span className="font-medium">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
