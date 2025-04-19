"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ShoppingBag,
  Search,
  Filter,
  Check,
  Clock,
  Package,
  Truck,
  AlertCircle,
} from "lucide-react";

export default function OrderManagement({ shopId }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(shopId || "");
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const router = useRouter();
  const { getIdToken } = useAuth();

  useEffect(() => {
    async function fetchShops() {
      try {
        // Get Firebase token
        const token = await getIdToken();

        if (!token) {
          console.error("No authentication token available");
          toast.error("Authentication error");
          return;
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
    async function fetchOrders() {
      if (!selectedShop) return;

      setIsLoading(true);
      try {
        // Get Firebase token
        const token = await getIdToken();

        if (!token) {
          console.error("No authentication token available");
          return;
        }

        const response = await fetch(`/api/shops/${selectedShop}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data);
      } catch (error) {
        toast.error("Error fetching orders");
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [selectedShop, getIdToken]);

  const handleShopChange = (e) => {
    setSelectedShop(e.target.value);
    router.push(`/retailer/orders?shopId=${e.target.value}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "" || order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (orderId) => {
    router.push(`/retailer/orders/${orderId}`);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Get Firebase token
      const token = await getIdToken();

      if (!token) {
        console.error("No authentication token available");
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Error updating order status");
      console.error("Error updating order status:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Processing
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
            Ready for Pickup
          </span>
        );
      case "completed":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      case "refunded":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Refunded
          </span>
        );
      default:
        return null;
    }
  };

  if (shops.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Shops Available
        </h3>
        <p className="text-gray-600 mb-4">
          You need to register and get a shop verified to manage orders.
        </p>
        <button
          onClick={() => router.push("/retailer/shops/new")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded mr-2"
        >
          Register New Shop
        </button>
        <button
          onClick={() => router.push("/retailer/shops")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
        >
          View My Shops
        </button>
      </div>
    );
  }

  // Get verified shops only
  const verifiedShops = shops.filter(
    (shop) => shop.verificationStatus === "verified"
  );

  if (verifiedShops.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Verified Shops
        </h3>
        <p className="text-gray-600 mb-4">
          You have {shops.length} {shops.length === 1 ? "shop" : "shops"}, but{" "}
          {shops.length === 1 ? "it hasn't" : "none have"} been verified yet.
          Shop verification is required before you can manage orders.
        </p>
        <p className="text-sm text-yellow-600 mb-4">
          <AlertCircle className="w-4 h-4 inline-block mr-1" />
          Please wait for an admin to verify your shop(s) or contact support for
          assistance.
        </p>
        <button
          onClick={() => router.push("/retailer/shops")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded"
        >
          View My Shops
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-gray-600">Manage your customer orders</p>
        </div>

        <div>
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
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by order number..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border rounded-md"
              />
            </div>

            <div className="w-full md:w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No orders found
            </h3>
            <p className="text-gray-500">
              {orders.length === 0
                ? "You haven't received any orders yet."
                : "No orders match your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBag className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items.length} items
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.shippingAddress.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.shippingAddress.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.orderStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewOrder(order._id)}
                          className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                        >
                          View
                        </button>

                        {order.orderStatus === "pending" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "processing")
                            }
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 flex items-center"
                          >
                            <Package className="w-3 h-3 mr-1" />
                            Process
                          </button>
                        )}

                        {order.orderStatus === "processing" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "ready_for_pickup")
                            }
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 flex items-center"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Ready
                          </button>
                        )}

                        {order.orderStatus === "ready_for_pickup" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "completed")
                            }
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 flex items-center"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Complete
                          </button>
                        )}

                        {["pending", "processing"].includes(
                          order.orderStatus
                        ) && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "cancelled")
                            }
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 flex items-center"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
