"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  CreditCard,
  Calendar,
  Clock,
  AlertCircle,
  ShoppingBag,
  CheckCircle,
  Truck,
  MapPin,
} from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, totalPrice } = useCart();
  const { user, mongoUser } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Check if Razorpay is loaded
  useEffect(() => {
    // Create a function to check if Razorpay is loaded
    const checkRazorpayLoaded = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return true;
      }
      return false;
    };

    // If Razorpay is already loaded, set the state
    if (checkRazorpayLoaded()) return;

    // If not loaded, create and append the script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Group items by purchase type
  const regularItems = cart.filter(
    (item) => !item.purchaseType || item.purchaseType === "regular"
  );
  const preBookItems = cart.filter((item) => item.purchaseType === "pre-book");
  const preBuyItems = cart.filter((item) => item.purchaseType === "pre-buy");

  // Calculate subtotals for each purchase type
  const regularSubtotal = regularItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const preBookSubtotal = preBookItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const preBuySubtotal = preBuyItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate the total from our subtotals to ensure accuracy
  const calculatedTotal = regularSubtotal + preBookSubtotal + preBuySubtotal;

  // Set default shipping fees (can be dynamic later)
  const shippingFee = 50;
  // Calculate tax based on our calculated total instead of totalPrice from context
  const estimatedTax = calculatedTotal * 0.05; // 5% tax example

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.length === 0 && !orderPlaced) {
      router.push("/");
      toast.error("Your cart is empty");
    }

    // Fetch user addresses
    const fetchAddresses = async () => {
      if (!mongoUser?._id) return;

      try {
        const response = await fetch(`/api/addresses?userId=${mongoUser._id}`);
        if (!response.ok) throw new Error("Failed to fetch addresses");

        const data = await response.json();
        setAddresses(data);

        // Set default selected address if available
        if (data.length > 0) {
          const defaultAddress = data.find((addr) => addr.isDefault) || data[0];
          setSelectedAddress(defaultAddress._id);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error("Could not load your saved addresses");
      }
    };

    fetchAddresses();
  }, [cart, router, mongoUser, orderPlaced]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Razorpay script failed to load");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setLoading(true);

    try {
      // 1. Find the selected address details
      const addressDetails = addresses.find(
        (addr) => addr._id === selectedAddress
      );

      // 2. Prepare order data with purchase types
      const orderData = {
        userId: mongoUser._id,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          shopId: item.shopId,
          productSnapshot: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          shopSnapshot: {
            name: item.shopName || "Local Shop",
            contactPhone: "",
            contactEmail: "",
            address: {
              addressLine1: "",
              city: "",
              state: "",
              postalCode: "",
            },
          },
          variantSnapshot: item.variant
            ? {
                name: item.variant,
                attributes: {},
              }
            : undefined,
          purchaseType: item.purchaseType || "regular",
        })),
        subtotal: calculatedTotal,
        shippingFee,
        taxes: estimatedTax,
        totalAmount: calculatedTotal + shippingFee + estimatedTax,
        shippingAddress: {
          name: addressDetails.name,
          phoneNumber: addressDetails.phoneNumber,
          addressLine1: addressDetails.addressLine1,
          addressLine2: addressDetails.addressLine2 || "",
          city: addressDetails.city,
          state: addressDetails.state,
          postalCode: addressDetails.postalCode,
          country: addressDetails.country || "India",
        },
        paymentMethod: "online",
        orderStatus: "pending",
        statusUpdates: [
          {
            status: "pending",
            timestamp: new Date(),
            notes: "Order placed by customer",
          },
        ],
        paymentDetails: {
          status: "pending",
        },
      };

      // 3. Create the order in the backend
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const orderResult = await orderResponse.json();
      setOrderId(orderResult._id);

      // 4. If payment method is online, create Razorpay order
      if (paymentMethod === "online") {
        const razorpayResponse = await fetch("/api/payments/razorpay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: orderData.totalAmount * 100, // Razorpay expects amount in paise
            orderId: orderResult._id,
            currency: "INR",
          }),
        });

        if (!razorpayResponse.ok) {
          throw new Error("Failed to create payment");
        }

        const razorpayData = await razorpayResponse.json();

        // 5. Ensure Razorpay script is loaded first
        const isRazorpayLoaded = await loadRazorpay();

        if (!isRazorpayLoaded) {
          toast.error(
            "Unable to load payment gateway. Please try again later."
          );
          throw new Error("Razorpay script failed to load");
        }

        // 6. Now initialize Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY, // Use the correct env var name that's in your .env file
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          name: "LocalLens",
          description: `Order #${orderResult.orderNumber}`,
          order_id: razorpayData.id,
          handler: async function (response) {
            // Handle payment success
            try {
              const verifyResponse = await fetch("/api/payments/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderResult._id,
                }),
              });

              if (!verifyResponse.ok) {
                throw new Error("Payment verification failed");
              }

              // Payment verified successfully
              toast.success("Payment successful! Your order has been placed.");
              setOrderPlaced(true);
              clearCart();
              router.push(`/profile/orders`);
            } catch (error) {
              console.error("Error verifying payment:", error);
              toast.error(
                "Payment verification failed. Please contact support."
              );
            }
          },
          prefill: {
            name: mongoUser.displayName || "",
            email: mongoUser.email || "",
            contact: addressDetails.phoneNumber || "",
          },
          theme: {
            color: "#10b981", // emerald-500
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment cancelled. Your order is still saved.");
              setLoading(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Order Placed Successfully!
            </h2>
            <p className="text-gray-600 mb-6">Thank you for your purchase.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={`/orders/${orderId}`}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
              >
                View Order Details
              </Link>
              <Link
                href="/products"
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-emerald-600"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to cart
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Checkout</h1>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left column - Order summary */}
          <div className="lg:col-span-7">
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Order Summary
                </h2>
              </div>

              {cart.length === 0 ? (
                <div className="p-6 text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Your cart is empty
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start shopping to add items to your cart.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      Browse Products
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Regular items section */}
                  {regularItems.length > 0 && (
                    <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-900 mb-4">
                        Regular Items
                      </h3>
                      <ul className="divide-y divide-gray-200">
                        {regularItems.map((item) => (
                          <li
                            key={`${item.productId}-${
                              item.variant || "default"
                            }`}
                            className="py-4 flex"
                          >
                            <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
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
                                    {item.name}
                                  </h4>
                                  <p className="ml-4 text-sm font-medium text-gray-900">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                                {item.variant && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.variant}
                                  </p>
                                )}
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <p className="text-gray-500">
                                  Qty {item.quantity}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pre-book items section */}
                  {preBookItems.length > 0 && (
                    <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                      <div className="flex items-start mb-4">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-md font-medium text-gray-900">
                            Pre-Book Items
                          </h3>
                          <p className="text-sm text-gray-500">
                            These items will be reserved for you in advance.
                          </p>
                        </div>
                      </div>

                      <ul className="divide-y divide-gray-200">
                        {preBookItems.map((item) => (
                          <li
                            key={`${item.productId}-${
                              item.variant || "default"
                            }`}
                            className="py-4 flex"
                          >
                            <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
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
                                    {item.name}
                                  </h4>
                                  <p className="ml-4 text-sm font-medium text-gray-900">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                                {item.variant && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.variant}
                                  </p>
                                )}
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Pre-Book
                                </span>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <p className="text-gray-500">
                                  Qty {item.quantity}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pre-buy items section */}
                  {preBuyItems.length > 0 && (
                    <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
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
                        {preBuyItems.map((item) => (
                          <li
                            key={`${item.productId}-${
                              item.variant || "default"
                            }`}
                            className="py-4 flex"
                          >
                            <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
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
                                    {item.name}
                                  </h4>
                                  <p className="ml-4 text-sm font-medium text-gray-900">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                                {item.variant && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.variant}
                                  </p>
                                )}
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  Pre-Buy
                                </span>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <p className="text-gray-500">
                                  Qty {item.quantity}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Address Section */}
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Delivery Address
                </h2>
                <Link
                  href="/profile/addresses"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Add New Address
                </Link>
              </div>

              <div className="px-4 py-5 sm:p-6">
                {addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No addresses found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add an address to continue with checkout.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/profile/addresses/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                      >
                        Add New Address
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className={`border rounded-lg p-4 cursor-pointer ${
                          selectedAddress === address._id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedAddress(address._id)}
                      >
                        <div className="flex items-start">
                          <input
                            type="radio"
                            checked={selectedAddress === address._id}
                            onChange={() => setSelectedAddress(address._id)}
                            className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mt-1"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {address.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {address.phoneNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {address.addressLine1}
                              {address.addressLine2 &&
                                `, ${address.addressLine2}`}
                              ,{address.city}, {address.state}{" "}
                              {address.postalCode}
                            </p>
                            {address.isDefault && (
                              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Payment Method
                </h2>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="border border-emerald-500 bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <input
                        type="radio"
                        checked={true}
                        readOnly
                        className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mt-1"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-emerald-500 mr-2" />
                          <p className="text-sm font-medium text-gray-900">
                            Pay Online (Razorpay)
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Pay securely using Credit/Debit card, UPI, Net
                          Banking, or Wallet
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Order details */}
          <div className="lg:col-span-5">
            <div className="bg-white shadow-md rounded-lg overflow-hidden sticky top-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Order Details
                </h2>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  {regularItems.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">Regular Items Subtotal</p>
                      <p className="text-gray-900 font-medium">
                        ₹{regularSubtotal.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {preBookItems.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">Pre-Book Items Subtotal</p>
                      <p className="text-gray-900 font-medium">
                        ₹{preBookSubtotal.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {preBuyItems.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">Pre-Buy Items Subtotal</p>
                      <p className="text-gray-900 font-medium">
                        ₹{preBuySubtotal.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">Shipping</p>
                      <p className="text-gray-900 font-medium">
                        ₹{shippingFee.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex justify-between text-sm mt-2">
                      <p className="text-gray-500">Estimated Tax</p>
                      <p className="text-gray-900 font-medium">
                        ₹{estimatedTax.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-base font-medium">
                      <p className="text-gray-900">Order Total</p>
                      <p className="text-emerald-600">
                        ₹
                        {(calculatedTotal + shippingFee + estimatedTax).toFixed(
                          2
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Special notes for different purchase types */}
                  {preBookItems.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex text-sm text-blue-700">
                        <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Pre-Book Information</p>
                          <p className="text-xs mt-1">
                            Pre-booked items will be reserved for you and may
                            have different pickup/delivery dates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {preBuyItems.length > 0 && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                      <div className="flex text-sm text-purple-700">
                        <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Pre-Buy Information</p>
                          <p className="text-xs mt-1">
                            Pre-buy items will be delivered once they become
                            available. You're securing them at a special price.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping note */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex text-sm text-gray-700">
                      <Truck className="h-5 w-5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Delivery Information</p>
                        <p className="text-xs mt-1">
                          Regular items typically ship within 1-2 business days.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || addresses.length === 0}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : addresses.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Place Order"
                    )}
                  </button>

                  {/* Explain why button is disabled */}
                  {addresses.length === 0 && (
                    <p className="text-xs text-red-600 text-center mt-2">
                      Please add a delivery address to continue
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
