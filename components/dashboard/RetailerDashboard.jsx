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
  ArrowUpRight,
  Loader2,
  PlusCircle,
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
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-3" />
        <p className="text-gray-500">Loading your dashboard...</p>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors flex items-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Product
          </Link>
          <Link
            href="/retailer/shops/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors flex items-center"
          >
            <Store className="h-4 w-4 mr-2" />
            Register Shop
          </Link>
        </div>
      </div>

      {/* Shop Status Banner */}
      <ShopStatusBanner />

      {/* Shop Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Shops</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                {dashboardData.shops.total}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
              <CheckCircle className="h-3 w-3 mr-1" />
              {dashboardData.shops.verified} verified
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
              <Clock className="h-3 w-3 mr-1" />
              {dashboardData.shops.pending} pending
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                {dashboardData.orders.total}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
              <Clock className="h-3 w-3 mr-1" />
              {dashboardData.orders.pending} pending
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" />
              {dashboardData.orders.processing} processing
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Reservations</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                {dashboardData.reservations.total}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
              <Clock className="h-3 w-3 mr-1" />
              {dashboardData.reservations.pending} pending
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
              <CheckCircle className="h-3 w-3 mr-1" />
              {dashboardData.reservations.ready} ready
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(dashboardData.revenue.total)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {formatCurrency(dashboardData.revenue.today)} today
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" />
              {formatCurrency(dashboardData.revenue.thisWeek)} week
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">
                Recent Activity
              </h2>
              <Link
                href="/retailer/analytics"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboardData.recentActivity.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p>No recent activity to display</p>
                <p className="text-sm mt-1">New activities will appear here</p>
              </div>
            ) : (
              dashboardData.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
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
                      <p className="text-sm text-gray-800 font-medium">
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
                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center transition-colors"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Sales Trends
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600 font-medium">Today</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(dashboardData.revenue.today)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
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
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600 font-medium">This Week</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(dashboardData.revenue.thisWeek)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
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
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600 font-medium">This Month</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(dashboardData.revenue.thisMonth)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-gray-100">
              <Link
                href="/retailer/analytics"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-end group transition-colors"
              >
                View Detailed Analytics{" "}
                <ChevronRight className="h-4 w-4 ml-1 group-hover:ml-2 transition-all" />
              </Link>
            </div>
          </div>

          {/* Product Inventory Alert */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium text-gray-800">
                Inventory Alerts
              </h2>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            {dashboardData.products.lowStock > 0 ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      {dashboardData.products.lowStock} products are low on
                      stock
                    </p>
                    <div className="mt-2">
                      <Link
                        href="/retailer/products?filter=lowStock"
                        className="text-xs font-medium text-red-700 hover:text-red-600 flex items-center group transition-colors"
                      >
                        View products{" "}
                        <ChevronRight className="h-3 w-3 ml-1 group-hover:ml-2 transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">
                      All products have adequate stock levels
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">
                  {dashboardData.products.total}
                </span>{" "}
                total products in inventory
              </p>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium text-gray-800">
                Location Insights
              </h2>
              <div className="p-2 bg-emerald-100 rounded-full">
                <MapPin className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
                <Users className="h-5 w-5 text-emerald-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">
                    <span className="font-semibold text-emerald-700">
                      {dashboardData.nearbyCustomers || "N/A"}
                    </span>{" "}
                    potential customers nearby
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Within 5km of your shops
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <Truck className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">
                    <span className="font-semibold text-blue-700">
                      {dashboardData.orders.pending +
                        dashboardData.orders.processing}
                    </span>{" "}
                    orders to fulfill
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    In your service area
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/retailer/shops"
            className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg group transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                  Manage Shops
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  View and manage all your registered shops
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/products"
            className="block p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg group transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg mr-3 group-hover:bg-emerald-200 transition-colors">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 group-hover:text-emerald-700 transition-colors">
                  Products
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage your inventory and product listings
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/orders"
            className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg group transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                  Process Orders
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  View and process customer orders
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/reservations"
            className="block p-4 bg-amber-50 hover:bg-amber-100 rounded-lg group transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg mr-3 group-hover:bg-amber-200 transition-colors">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 group-hover:text-amber-700 transition-colors">
                  Reservations
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage pre-bookings and reservations
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/analytics"
            className="block p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg group transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3 group-hover:bg-indigo-200 transition-colors">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">
                  Analytics
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  View performance metrics and reports
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/retailer/products/new"
            className="block p-4 bg-pink-50 hover:bg-pink-100 rounded-lg group transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg mr-3 group-hover:bg-pink-200 transition-colors">
                <PlusCircle className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 group-hover:text-pink-700 transition-colors">
                  Add New Product
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Create a new product listing
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Top Products */}
      {dashboardData.topProducts && dashboardData.topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">
                Top Selling Products
              </h2>
              <Link
                href="/retailer/analytics"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center group transition-colors"
              >
                View All{" "}
                <ChevronRight className="h-4 w-4 ml-1 group-hover:ml-2 transition-all" />
              </Link>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.topProducts.slice(0, 4).map((product, index) => (
                <div
                  key={index}
                  className="border border-gray-200 hover:border-emerald-200 rounded-lg p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center mb-3">
                    <div className="h-12 w-12 flex-shrink-0 mr-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 rounded-md object-cover shadow-sm"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center shadow-sm">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">
                      {product.quantity} sold
                    </span>
                    <span className="font-medium text-emerald-700">
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
