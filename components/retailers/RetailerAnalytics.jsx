"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  BarChart2,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function RetailerAnalytics({ shopId }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(shopId || "");
  const [shops, setShops] = useState([]);
  const [timeRange, setTimeRange] = useState("month");
  const router = useRouter();

  useEffect(() => {
    async function fetchShops() {
      try {
        const response = await fetch("/api/retailers/shops?verified=true");

        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }

        const data = await response.json();
        setShops(data);

        // If no shopId was provided but user has shops, select the first one
        if (!shopId && data.length > 0) {
          setSelectedShop(data[0]._id);
        }
      } catch (error) {
        toast.error("Error fetching shops");
        console.error("Error fetching shops:", error);
      }
    }

    fetchShops();
  }, [shopId]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!selectedShop) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/shops/${selectedShop}/analytics?timeRange=${timeRange}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        toast.error("Error fetching analytics data");
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedShop, timeRange]);

  const handleShopChange = (e) => {
    setSelectedShop(e.target.value);
    router.push(`/retailer/analytics?shopId=${e.target.value}`);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "all":
        return "All Time";
      default:
        return "This Month";
    }
  };

  // Helper function to determine if a trend is up or down
  const getTrendIcon = (value) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <ChevronDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (shops.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <BarChart2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Verified Shops
        </h3>
        <p className="text-gray-600 mb-4">
          You need at least one verified shop to view analytics.
        </p>
        <button
          onClick={() => router.push("/retailer/shops")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded"
        >
          Go to My Shops
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-600">Track your shop performance</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedShop}
            onChange={handleShopChange}
            className="p-2 border rounded bg-white"
          >
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>

          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => handleTimeRangeChange("week")}
              className={`px-3 py-2 text-sm ${
                timeRange === "week"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleTimeRangeChange("month")}
              className={`px-3 py-2 text-sm ${
                timeRange === "month"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleTimeRangeChange("year")}
              className={`px-3 py-2 text-sm ${
                timeRange === "year"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Year
            </button>
            <button
              onClick={() => handleTimeRangeChange("all")}
              className={`px-3 py-2 text-sm ${
                timeRange === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      ) : !analytics ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No analytics data available
          </h3>
          <p className="text-gray-500">
            We couldn&apos;t find any data for the selected time period.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(analytics.revenue.total)}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {getTrendIcon(analytics.revenue.percentChange)}
                <span
                  className={
                    analytics.revenue.percentChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(analytics.revenue.percentChange)}%
                </span>
                <span className="text-gray-500 ml-1">
                  vs previous {timeRange}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Orders</p>
                  <h3 className="text-2xl font-bold">
                    {analytics.orders.total}
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {getTrendIcon(analytics.orders.percentChange)}
                <span
                  className={
                    analytics.orders.percentChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(analytics.orders.percentChange)}%
                </span>
                <span className="text-gray-500 ml-1">
                  vs previous {timeRange}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Products Sold</p>
                  <h3 className="text-2xl font-bold">
                    {analytics.productsSold.total}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {getTrendIcon(analytics.productsSold.percentChange)}
                <span
                  className={
                    analytics.productsSold.percentChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(analytics.productsSold.percentChange)}%
                </span>
                <span className="text-gray-500 ml-1">
                  vs previous {timeRange}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customers</p>
                  <h3 className="text-2xl font-bold">
                    {analytics.customers.total}
                  </h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {getTrendIcon(analytics.customers.percentChange)}
                <span
                  className={
                    analytics.customers.percentChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(analytics.customers.percentChange)}%
                </span>
                <span className="text-gray-500 ml-1">
                  vs previous {timeRange}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-lg font-medium mb-4">Top Selling Products</h3>
              {analytics.topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No product sales data available
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
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
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {product.quantity} sold
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            {product.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${product.percentOfTotal}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-lg font-medium mb-4">Sales by Category</h3>
              {analytics.categoryBreakdown.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No category sales data available
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.categoryBreakdown.map((category, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {category.name}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(category.revenue)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${category.percentOfTotal}%`,
                            backgroundColor: category.color || "#10b981",
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{category.percentOfTotal}%</span>
                        <span>{category.orderCount} orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Sales Over Time</h3>
                <div className="text-sm text-gray-500">
                  {getTimeRangeLabel()}
                </div>
              </div>
              {analytics.salesOverTime.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No sales data available for the selected period
                </p>
              ) : (
                <div className="h-64">
                  {/* This would be a chart component in a real implementation */}
                  <div className="bg-gray-100 h-full rounded flex items-center justify-center">
                    <p className="text-gray-500">Sales Chart Placeholder</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              {analytics.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div
                        className={`p-2 rounded-full mr-3 ${
                          activity.type === "order"
                            ? "bg-blue-100"
                            : activity.type === "product"
                            ? "bg-purple-100"
                            : activity.type === "reservation"
                            ? "bg-amber-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {activity.type === "order" ? (
                          <ShoppingBag className="h-4 w-4 text-blue-600" />
                        ) : activity.type === "product" ? (
                          <Package className="h-4 w-4 text-purple-600" />
                        ) : activity.type === "reservation" ? (
                          <Calendar className="h-4 w-4 text-amber-600" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
