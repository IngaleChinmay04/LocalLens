"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
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
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Clock,
  Filter,
  Download,
} from "lucide-react";

export default function RetailerAnalytics({ shopId }) {
  const { getIdToken } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(shopId || "");
  const [shops, setShops] = useState([]);
  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    async function fetchShops() {
      try {
        // Get authentication token
        const token = await getIdToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const response = await fetch("/api/retailers/shops?verified=true", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
  }, [shopId, getIdToken]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!selectedShop) return;

      setIsLoading(true);
      try {
        // Get authentication token
        const token = await getIdToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const response = await fetch(
          `/api/shops/${selectedShop}/analytics?timeRange=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const data = await response.json();

        // Check if the API already returns these data points before using mock data
        const enhancedData = {
          ...data,
          // Use API data if available, otherwise use mock data
          weeklyData: data.weeklyData || generateMockWeeklyData(),
          locationData: data.locationData || generateMockLocationData(),
          demographics: data.demographics || generateMockDemographics(),
          hourlyPerformance:
            data.hourlyPerformance || generateMockHourlyPerformance(),
          productMetrics:
            data.productMetrics || generateMockProductMetrics(data.topProducts),
        };

        setAnalytics(enhancedData);
      } catch (error) {
        toast.error("Error fetching analytics data");
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedShop, timeRange, getIdToken]);

  // Generate mock data for enhanced visualizations
  const generateMockWeeklyData = () => {
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return weekdays.map((day) => ({
      day,
      revenue: Math.floor(Math.random() * 10000) + 1000,
      orders: Math.floor(Math.random() * 30) + 5,
      customers: Math.floor(Math.random() * 40) + 10,
    }));
  };

  const generateMockLocationData = () => {
    const locations = [
      "Central City",
      "North Area",
      "East District",
      "West Side",
      "South Zone",
    ];
    return locations.map((location) => ({
      location,
      customers: Math.floor(Math.random() * 100) + 20,
      orders: Math.floor(Math.random() * 80) + 10,
      revenue: Math.floor(Math.random() * 20000) + 5000,
      percentageOfTotal: Math.floor(Math.random() * 30) + 5,
    }));
  };

  const generateMockDemographics = () => {
    return {
      age: [
        { group: "18-24", percentage: 15 },
        { group: "25-34", percentage: 32 },
        { group: "35-44", percentage: 27 },
        { group: "45-54", percentage: 18 },
        { group: "55+", percentage: 8 },
      ],
      gender: [
        { type: "Male", percentage: 45 },
        { type: "Female", percentage: 52 },
        { type: "Other", percentage: 3 },
      ],
    };
  };

  const generateMockHourlyPerformance = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: i,
        orders: Math.floor(Math.random() * 15) + (i >= 10 && i <= 20 ? 10 : 2),
        revenue:
          Math.floor(Math.random() * 5000) + (i >= 10 && i <= 20 ? 3000 : 500),
      });
    }
    return hours;
  };

  const generateMockProductMetrics = (topProducts) => {
    if (!topProducts || topProducts.length === 0) {
      return [];
    }

    return topProducts.map((product) => ({
      ...product,
      viewCount: Math.floor(Math.random() * 1000) + 200,
      conversionRate: (Math.random() * 10 + 2).toFixed(1),
      averageRating: (Math.random() * 2 + 3).toFixed(1),
      returnRate: (Math.random() * 5).toFixed(1),
    }));
  };

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
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Get percentage color class based on value
  const getPercentageColorClass = (value) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-500";
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
          <h1 className="text-2xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-600">
            Deep insights into your shop performance
          </p>
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

      {/* Analytics Tab Navigation */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "overview"
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "sales"
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Sales Analysis
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "products"
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Product Performance
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "customers"
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Customer Insights
            </button>
          </nav>
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
          {/* Overview Tab Content */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Total Revenue
                      </p>
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
                      className={getPercentageColorClass(
                        analytics.revenue.percentChange
                      )}
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
                      className={getPercentageColorClass(
                        analytics.orders.percentChange
                      )}
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
                      <p className="text-sm text-gray-500 mb-1">
                        Products Sold
                      </p>
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
                      className={getPercentageColorClass(
                        analytics.productsSold.percentChange
                      )}
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
                      className={getPercentageColorClass(
                        analytics.customers.percentChange
                      )}
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Weekly Performance</h3>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </button>
                  </div>
                  <div className="h-64 bg-gray-50 rounded-lg p-4 relative">
                    {/* Weekly performance chart visualization placeholder */}
                    <div className="flex h-full">
                      {analytics.weeklyData.map((day, index) => (
                        <div
                          key={index}
                          className="flex-1 flex flex-col justify-end items-center"
                        >
                          <div
                            className="w-full max-w-[30px] bg-emerald-500 rounded-t-sm mx-auto"
                            style={{
                              height: `${(day.revenue / 10000) * 100}%`,
                            }}
                          ></div>
                          <div className="text-xs mt-2 font-medium">
                            {day.day}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-2 right-2 text-xs font-medium text-gray-500">
                      Revenue trend
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">
                    Top Performing Locations
                  </h3>
                  <div className="space-y-4">
                    {analytics.locationData
                      .slice(0, 4)
                      .map((location, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm font-medium text-gray-900">
                                {location.location}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(location.revenue)}
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full bg-emerald-600"
                              style={{
                                width: `${location.percentageOfTotal}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{location.customers} customers</span>
                            <span>{location.orders} orders</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Sales Analysis Tab Content */}
          {activeTab === "sales" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hourly Sales Performance */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      Hourly Sales Performance
                    </h3>
                    <div className="text-sm text-gray-500">
                      {getTimeRangeLabel()}
                    </div>
                  </div>
                  <div className="h-72 bg-gray-50 rounded-lg p-4">
                    {/* Hourly sales chart visualization placeholder */}
                    <div className="flex h-full items-end">
                      {analytics.hourlyPerformance.map((hour, index) => (
                        <div
                          key={index}
                          className="flex-1 flex flex-col justify-end items-center group relative"
                        >
                          <div
                            className="w-full max-w-[8px] bg-blue-500 rounded-t-sm mx-auto cursor-pointer hover:bg-blue-600"
                            style={{ height: `${(hour.orders / 20) * 100}%` }}
                          ></div>
                          <div className="text-xs mt-2">{hour.hour}:00</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">
                    Order Status Breakdown
                  </h3>
                  <div className="relative pt-1">
                    <p className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Checkout Started
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        198
                      </span>
                    </p>
                    <div className="overflow-hidden h-6 text-xs flex rounded bg-emerald-200">
                      <div
                        style={{ width: "16%" }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                      >
                        16%
                      </div>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <p className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Purchases
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {analytics.orders.total}
                      </span>
                    </p>
                    <div className="overflow-hidden h-6 text-xs flex rounded bg-emerald-200">
                      <div
                        style={{ width: "12%" }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                      >
                        12%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">
                    Order Status Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-4xl font-bold text-blue-600 mb-1">
                        42
                      </div>
                      <div className="text-sm text-gray-600">Processing</div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <div className="text-4xl font-bold text-amber-600 mb-1">
                        18
                      </div>
                      <div className="text-sm text-gray-600">Shipped</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-4xl font-bold text-green-600 mb-1">
                        {analytics.orders.total - 70}
                      </div>
                      <div className="text-sm text-gray-600">Delivered</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-4xl font-bold text-red-600 mb-1">
                        10
                      </div>
                      <div className="text-sm text-gray-600">Cancelled</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Average Order Value
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(
                          analytics.revenue.total / analytics.orders.total
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Product Performance Tab Content */}
          {activeTab === "products" && (
            <>
              <div className="bg-white rounded-lg shadow">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      Product Performance Metrics
                    </h3>
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 text-gray-400 mr-2" />
                      <select className="text-sm border-gray-300 rounded">
                        <option value="revenue">Sort by Revenue</option>
                        <option value="quantity">Sort by Quantity</option>
                        <option value="views">Sort by Views</option>
                        <option value="conversion">
                          Sort by Conversion Rate
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Revenue
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Quantity
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Views
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Conversion (%)
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Rating
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Return Rate (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.productMetrics.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
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
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {product.category}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(product.revenue)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.viewCount}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.conversionRate}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <span className="ml-1 text-sm text-gray-900">
                                {product.averageRating}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.returnRate}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">Inventory Status</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          Products in Stock
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          78%
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full"
                          style={{ width: "78%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          Low Stock Products
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          15%
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-amber-500 h-2.5 rounded-full"
                          style={{ width: "15%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          Out of Stock Products
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          7%
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full"
                          style={{ width: "7%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Total Products
                      </div>
                      <div className="text-lg font-bold">
                        {analytics.productMetrics.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">
                    Product View to Purchase Ratio
                  </h3>
                  <div className="h-64 bg-gray-50 rounded-lg p-4">
                    {/* Product conversion visualization placeholder */}
                    <div className="flex flex-col h-full justify-center items-center">
                      <div className="relative w-40 h-40">
                        <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                        <div
                          className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent"
                          style={{ transform: "rotate(45deg)" }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <div className="text-3xl font-bold text-emerald-600">
                            12.4%
                          </div>
                          <div className="text-sm text-gray-500">
                            Conversion Rate
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-500 max-w-xs text-center">
                        For every 100 product views, 12.4 result in a purchase
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Customer Insights Tab Content */}
          {activeTab === "customers" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">
                    Customer Demographics
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Age Distribution
                      </h4>
                      {analytics.demographics.age.map((item, index) => (
                        <div key={index} className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm text-gray-600">
                              {item.group}
                            </div>
                            <div className="text-sm font-medium">
                              {item.percentage}%
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Gender Distribution
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {analytics.demographics.gender.map((item, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg text-center"
                          >
                            <div className="text-xl font-bold text-gray-700">
                              {item.percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">
                    Customer Retention
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Returning Customers
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        68%
                      </div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        4.2% from previous period
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        New Customers
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        32%
                      </div>
                      <div className="text-xs text-red-600 flex items-center mt-1">
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        4.2% from previous period
                      </div>
                    </div>
                  </div>
                  <div className="h-56 bg-gray-50 rounded-lg p-4">
                    {/* Customer retention chart visualization placeholder */}
                    <div className="h-full flex items-end">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div className="relative w-full flex justify-center">
                            <div className="h-32 w-6 bg-emerald-200 rounded-t-sm"></div>
                            <div
                              className="absolute bottom-0 h-32 w-6 bg-emerald-500 rounded-t-sm"
                              style={{
                                height: `${Math.max(20, 70 - i * 10)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="text-xs mt-2">
                            {i + 1} {i === 0 ? "Purchase" : "Purchases"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.max(5, 60 - i * 10)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Customer Reviews</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="font-medium">4.7</span>
                      <span className="mx-1">•</span>
                      <span>127 reviews</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <div className="text-sm font-medium w-3 text-gray-700">
                          {rating}
                        </div>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 ml-2 mr-2" />
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{
                              width:
                                rating === 5
                                  ? "60%"
                                  : rating === 4
                                  ? "25%"
                                  : rating === 3
                                  ? "10%"
                                  : rating === 2
                                  ? "3%"
                                  : "2%",
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 w-8">
                          {rating === 5
                            ? "60%"
                            : rating === 4
                            ? "25%"
                            : rating === 3
                            ? "10%"
                            : rating === 2
                            ? "3%"
                            : "2%"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">
                      Recent Review Trends
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 h-8 bg-gray-50 rounded-lg flex items-center px-3">
                        <div className="h-1 rounded-full bg-gradient-to-r from-yellow-400 to-emerald-500 flex-1"></div>
                      </div>
                      <div className="flex items-center ml-3">
                        <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                        <span className="text-sm text-gray-700">Improving</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-4">
                    Customer Lifetime Value
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="col-span-3 bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Average CLV
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(12500)}
                      </div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        8.3% from previous period
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          First Purchase
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(3200)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: "26%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          Repeat Purchases
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(7800)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: "62%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">Referrals</div>
                        <div className="text-sm font-medium">
                          {formatCurrency(1500)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: "12%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Measured across customer lifetime
                    </div>
                    <div className="flex items-center text-xs text-emerald-600">
                      <Clock className="h-3 w-3 mr-1" />
                      24 month average
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
