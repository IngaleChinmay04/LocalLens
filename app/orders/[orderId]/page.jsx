"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ChevronLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  ShoppingBag,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { user, mongoUser } = useAuth();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!mongoUser?._id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/orders/${orderId}?userId=${mongoUser._id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }

        const data = await response.json();
        setOrderDetails(data);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError(error.message);
        toast.error("Could not load order details");
      } finally {
        setLoading(false);
      }
    };

    if (mongoUser?._id) {
      fetchOrderDetails();
    }
  }, [orderId, mongoUser]);

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper to get status badge color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper to get purchase type badge color
  const getPurchaseTypeColor = (type) => {
    switch (type) {
      case "pre-book":
        return "bg-blue-100 text-blue-800";
      case "pre-buy":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Group items by purchase type for display
  const groupItemsByType = (items) => {
    return items.reduce((groups, item) => {
      const type = item.purchaseType || "regular";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
      return groups;
    }, {});
  };

  // Helper to get icon for order status
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "processing":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Order
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <Package className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The order you are looking for could not be found.
            </p>
            <Link
              href="/profile/orders"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group items by purchase type for display
  const groupedItems = groupItemsByType(orderDetails.items);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/profile/orders"
            className="flex items-center text-gray-600 hover:text-emerald-600"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Order Details
          </h1>
          <div className="flex items-center mt-2">
            <p className="text-sm text-gray-500">
              Order #{orderDetails.orderNumber || orderId.substring(0, 8)}
            </p>
            <span className="mx-2 text-gray-300">•</span>
            <p className="text-sm text-gray-500">
              Placed on {formatDate(orderDetails.createdAt)}
            </p>
            <span className="mx-2 text-gray-300">•</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                orderDetails.orderStatus
              )}`}
            >
              {orderDetails.orderStatus.charAt(0).toUpperCase() +
                orderDetails.orderStatus.slice(1)}
            </span>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left column - Order items and status */}
          <div className="lg:col-span-8">
            {/* Order Status Timeline */}
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Order Status
                </h2>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {orderDetails.statusUpdates.map((update, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== orderDetails.statusUpdates.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            ></span>
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                {getStatusIcon(update.status)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {update.status.charAt(0).toUpperCase() +
                                    update.status.slice(1)}
                                  {update.notes && (
                                    <span className="text-gray-500">
                                      {" "}
                                      - {update.notes}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(update.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Order Items
                </h2>
              </div>

              <div className="px-4 py-5 sm:p-6">
                {/* Regular Items */}
                {groupedItems["regular"] &&
                  groupedItems["regular"].length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 mb-4">
                        Regular Items
                      </h3>
                      <ul className="divide-y divide-gray-200">
                        {groupedItems["regular"].map((item, index) => (
                          <li key={index} className="py-4 flex">
                            <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                              {item.productSnapshot.images &&
                              item.productSnapshot.images[0] ? (
                                <Image
                                  src={item.productSnapshot.images[0]}
                                  alt={item.productSnapshot.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {item.productSnapshot.name}
                                  </h4>
                                  <p className="ml-4 text-sm font-medium text-gray-900">
                                    ₹{item.totalPrice.toFixed(2)}
                                  </p>
                                </div>
                                {item.variantSnapshot && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.variantSnapshot.name}
                                  </p>
                                )}
                                <div className="flex mt-1">
                                  <Link
                                    href={`/shops/${item.shopId}`}
                                    className="text-xs text-emerald-600 hover:text-emerald-500"
                                  >
                                    {item.shopSnapshot?.name || "Shop"}
                                  </Link>
                                </div>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <p className="text-gray-500">
                                  Qty {item.quantity}
                                </p>
                                <p className="text-gray-500">
                                  ₹{item.unitPrice.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Pre-Book Items */}
                {groupedItems["pre-book"] &&
                  groupedItems["pre-book"].length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-start mb-4">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-md font-medium text-gray-900">
                            Pre-Book Items
                          </h3>
                          <p className="text-sm text-gray-500">
                            These items have been reserved for you.
                          </p>
                        </div>
                      </div>

                      <ul className="divide-y divide-gray-200">
                        {groupedItems["pre-book"].map((item, index) => (
                          <li key={index} className="py-4 flex">
                            <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                              {item.productSnapshot.images &&
                              item.productSnapshot.images[0] ? (
                                <Image
                                  src={item.productSnapshot.images[0]}
                                  alt={item.productSnapshot.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {item.productSnapshot.name}
                                  </h4>
                                  <p className="ml-4 text-sm font-medium text-gray-900">
                                    ₹{item.totalPrice.toFixed(2)}
                                  </p>
                                </div>
                                {item.variantSnapshot && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.variantSnapshot.name}
                                  </p>
                                )}
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Pre-Book
                                </span>
                                <div className="flex mt-1">
                                  <Link
                                    href={`/shops/${item.shopId}`}
                                    className="text-xs text-emerald-600 hover:text-emerald-500"
                                  >
                                    {item.shopSnapshot?.name || "Shop"}
                                  </Link>
                                </div>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <p className="text-gray-500">
                                  Qty {item.quantity}
                                </p>
                                <p className="text-gray-500">
                                  ₹{item.unitPrice.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Pre-Buy Items */}
                {groupedItems["pre-buy"] &&
                  groupedItems["pre-buy"].length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-start mb-4">
                        <div className="flex-shrink-0">
                          <Clock className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-md font-medium text-gray-900">
                            Pre-Buy Items
                          </h3>
                          <p className="text-sm text-gray-500">
                            These items will be delivered once available.
                          </p>
                        </div>
                      </div>

                      <ul className="divide-y divide-gray-200">
                        {groupedItems["pre-buy"].map((item, index) => (
                          <li key={index} className="py-4 flex">
                            <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                              {item.productSnapshot.images &&
                              item.productSnapshot.images[0] ? (
                                <Image
                                  src={item.productSnapshot.images[0]}
                                  alt={item.productSnapshot.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {item.productSnapshot.name}
                                  </h4>
                                  <p className="ml-4 text-sm font-medium text-gray-900">
                                    ₹{item.totalPrice.toFixed(2)}
                                  </p>
                                </div>
                                {item.variantSnapshot && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.variantSnapshot.name}
                                  </p>
                                )}
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  Pre-Buy
                                </span>
                                <div className="flex mt-1">
                                  <Link
                                    href={`/shops/${item.shopId}`}
                                    className="text-xs text-emerald-600 hover:text-emerald-500"
                                  >
                                    {item.shopSnapshot?.name || "Shop"}
                                  </Link>
                                </div>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <p className="text-gray-500">
                                  Qty {item.quantity}
                                </p>
                                <p className="text-gray-500">
                                  ₹{item.unitPrice.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Right column - Order summary, delivery info, etc */}
          <div className="lg:col-span-4">
            {/* Order Summary */}
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Order Summary
                </h2>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Subtotal</p>
                    <p className="text-gray-900 font-medium">
                      ₹{orderDetails.subtotal.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Shipping</p>
                    <p className="text-gray-900 font-medium">
                      ₹{orderDetails.shippingFee.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Tax</p>
                    <p className="text-gray-900 font-medium">
                      ₹{orderDetails.taxes.toFixed(2)}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-base font-medium">
                      <p className="text-gray-900">Total</p>
                      <p className="text-emerald-600">
                        ₹{orderDetails.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Payment Information
                    </h3>
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">
                        {orderDetails.paymentMethod.charAt(0).toUpperCase() +
                          orderDetails.paymentMethod.slice(1)}{" "}
                        Payment
                      </span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          orderDetails.paymentDetails?.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {orderDetails.paymentDetails?.status === "completed"
                          ? "Paid"
                          : "Payment Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Shipping Information
                </h2>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {orderDetails.shippingAddress.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {orderDetails.shippingAddress.phoneNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {orderDetails.shippingAddress.addressLine1}
                      {orderDetails.shippingAddress.addressLine2 &&
                        `, ${orderDetails.shippingAddress.addressLine2}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {orderDetails.shippingAddress.city},{" "}
                      {orderDetails.shippingAddress.state}{" "}
                      {orderDetails.shippingAddress.postalCode}
                    </p>
                    <p className="text-sm text-gray-500">
                      {orderDetails.shippingAddress.country}
                    </p>
                  </div>
                </div>

                {/* Estimated delivery date (if available) */}
                {orderDetails.estimatedDelivery && (
                  <div className="flex items-start mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Estimated Delivery
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(orderDetails.estimatedDelivery)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Support */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Need Help?
                </h2>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <Link
                    href="/contact"
                    className="flex items-center text-emerald-600 hover:text-emerald-500"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    <span>Contact Customer Service</span>
                  </Link>

                  <Link
                    href="/faq"
                    className="flex items-center text-emerald-600 hover:text-emerald-500"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    <span>Frequently Asked Questions</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
