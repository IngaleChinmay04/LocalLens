"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  BarChart2,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingBag,
  Store,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function PlatformAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month"); // Default to monthly view
  const { getIdToken } = useAuth();

  useEffect(() => {
    const fetchPlatformAnalytics = async () => {
      setIsLoading(true);
      try {
        const token = await getIdToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const response = await fetch(
          `/api/admin/analytics?timeRange=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch platform analytics data");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching platform analytics:", error);
        toast.error("Failed to load platform analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformAnalytics();
  }, [timeRange, getIdToken]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to format large numbers with K, M suffixes
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No analytics data available
        </h3>
        <p className="text-gray-500">
          We couldn&apos;t find any data for the selected time period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-gray-600">
            Comprehensive metrics and insights about the LocalLens platform
          </p>
        </div>

        <div className="flex">
          <div className="flex p-1 bg-gray-100 rounded-md">
            <button
              onClick={() => handleTimeRangeChange("week")}
              className={`px-3 py-2 text-sm ${
                timeRange === "week"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-md`}
            >
              Week
            </button>
            <button
              onClick={() => handleTimeRangeChange("month")}
              className={`px-3 py-2 text-sm ${
                timeRange === "month"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-md ml-1`}
            >
              Month
            </button>
            <button
              onClick={() => handleTimeRangeChange("quarter")}
              className={`px-3 py-2 text-sm ${
                timeRange === "quarter"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-md ml-1`}
            >
              Quarter
            </button>
            <button
              onClick={() => handleTimeRangeChange("year")}
              className={`px-3 py-2 text-sm ${
                timeRange === "year"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-md ml-1`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Activity Metrics - 24-hour snapshot */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Platform Activity (24h)</h2>
          <div className="p-2 bg-blue-100 rounded-full">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-500">New Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {analytics.activityMetrics.newUsers24h}
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Store className="h-5 w-5 text-emerald-600 mr-2" />
              <span className="text-sm text-gray-500">New Shops</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {analytics.activityMetrics.newShops24h}
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ShoppingBag className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-sm text-gray-500">New Orders</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {analytics.activityMetrics.newOrders24h}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm text-gray-500">New Products</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {analytics.activityMetrics.newProducts24h}
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Users</p>
              <h3 className="text-2xl font-bold">
                {formatNumber(analytics.userAnalytics.total)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center text-xs text-gray-500">
              {analytics.userAnalytics.growth &&
              analytics.userAnalytics.growth.length > 0 &&
              analytics.userAnalytics.growth[
                analytics.userAnalytics.growth.length - 1
              ].count > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">
                    {
                      analytics.userAnalytics.growth[
                        analytics.userAnalytics.growth.length - 1
                      ].count
                    }
                  </span>{" "}
                  new users today
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-gray-400 mr-1" />
                  <span>No new users today</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Shops</p>
              <h3 className="text-2xl font-bold">
                {formatNumber(analytics.shopAnalytics.total)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Store className="h-6 w-6 text-emerald-600" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center text-xs text-gray-500">
              <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full mr-2">
                {analytics.shopAnalytics.verificationStats[0].percentage}%
                verified
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                {analytics.shopAnalytics.verificationStats[1].percentage}%
                pending
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold">
                {formatNumber(analytics.orderAnalytics.total)}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center text-xs text-gray-500">
              {analytics.orderAnalytics.growth &&
              analytics.orderAnalytics.growth.length > 0 &&
              analytics.orderAnalytics.growth[
                analytics.orderAnalytics.growth.length - 1
              ].count > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">
                    {
                      analytics.orderAnalytics.growth[
                        analytics.orderAnalytics.growth.length - 1
                      ].count
                    }
                  </span>{" "}
                  new orders today
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-gray-400 mr-1" />
                  <span>No new orders today</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(analytics.revenueAnalytics.total)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center text-xs text-gray-500">
              {analytics.revenueAnalytics.byDay &&
              analytics.revenueAnalytics.byDay.length > 0 &&
              analytics.revenueAnalytics.byDay[
                analytics.revenueAnalytics.byDay.length - 1
              ].amount > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">
                    {formatCurrency(
                      analytics.revenueAnalytics.byDay[
                        analytics.revenueAnalytics.byDay.length - 1
                      ].amount
                    )}
                  </span>{" "}
                  today
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-gray-400 mr-1" />
                  <span>No revenue today</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">User Growth</h3>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
          <div className="h-72 bg-gray-50 rounded-lg p-4">
            {/* User growth chart visualization */}
            <div className="flex h-full items-end relative">
              {analytics.userAnalytics.growth.map((day, index) => {
                // Get max count to calculate height percentage
                const maxCount = Math.max(
                  ...analytics.userAnalytics.growth.map((d) => d.count),
                  1
                );
                const heightPercentage = (day.count / maxCount) * 100;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col justify-end items-center"
                  >
                    <div className="relative group">
                      <div
                        className="w-full max-w-[8px] bg-blue-500 rounded-t-sm mx-auto cursor-pointer hover:bg-blue-600"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                      <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap left-1/2 transform -translate-x-1/2">
                        {day.date}: {day.count} new users
                      </div>
                    </div>
                    {index % 7 === 0 && (
                      <div className="text-xs mt-2 text-gray-500 absolute -bottom-6">
                        {day.date.slice(-2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Revenue Trend</h3>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
          <div className="h-72 bg-gray-50 rounded-lg p-4">
            {/* Revenue chart visualization */}
            <div className="flex h-full items-end relative">
              {analytics.revenueAnalytics.byDay.map((day, index) => {
                // Get max amount to calculate height percentage
                const maxAmount = Math.max(
                  ...analytics.revenueAnalytics.byDay.map((d) => d.amount),
                  1
                );
                const heightPercentage = (day.amount / maxAmount) * 100;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col justify-end items-center"
                  >
                    <div className="relative group">
                      <div
                        className="w-full max-w-[8px] bg-green-500 rounded-t-sm mx-auto cursor-pointer hover:bg-green-600"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                      <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap left-1/2 transform -translate-x-1/2">
                        {day.date}: {formatCurrency(day.amount)}
                      </div>
                    </div>
                    {index % 7 === 0 && (
                      <div className="text-xs mt-2 text-gray-500 absolute -bottom-6">
                        {day.date.slice(-2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution and Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-medium mb-4">User Distribution</h3>
          <div className="space-y-4">
            {analytics.userAnalytics.distribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.role}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {item.count} ({item.percentage}%)
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor:
                        index === 0
                          ? "#3b82f6" // blue for customers
                          : index === 1
                          ? "#8b5cf6" // purple for retailers
                          : "#10b981", // green for admins
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-medium mb-4">
            Order Status Distribution
          </h3>
          <div className="space-y-4">
            {analytics.orderAnalytics.statusDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.status}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {item.count} ({item.percentage}%)
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor:
                        item.status === "Pending"
                          ? "#f59e0b" // amber
                          : item.status === "Processing"
                          ? "#3b82f6" // blue
                          : item.status === "Shipped"
                          ? "#8b5cf6" // purple
                          : item.status === "Delivered"
                          ? "#10b981" // green
                          : item.status === "Completed"
                          ? "#10b981" // green
                          : "#ef4444", // red for cancelled
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Product Categories */}
      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-lg font-medium mb-4">Top Product Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {analytics.productAnalytics.topCategories.map((category, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-gray-700">
                {category.percentage}%
              </div>
              <div className="text-xs text-gray-500 truncate">
                {category.category}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {category.count} products
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
