"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function CustomerDashboard() {
  const { user, mongoUser } = useAuth();
  const [featuredShops, setFeaturedShops] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    // This would be replaced with actual API calls in a production app
    setFeaturedShops([
      { id: 1, name: "Organic Greens", category: "Grocery" },
      { id: 2, name: "Artisan Crafts", category: "Handicrafts" },
      { id: 3, name: "Local Bakery", category: "Food" },
    ]);

    setFeaturedProducts([
      { id: 1, name: "Fresh Organic Vegetables", price: 120 },
      { id: 2, name: "Handmade Pottery", price: 450 },
      { id: 3, name: "Freshly Baked Bread", price: 80 },
    ]);
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {user
              ? `Welcome, ${user.displayName}!`
              : "Discover Local Shops Near You"}
          </h1>
          <p className="text-xl mb-8 max-w-2xl">
            {user
              ? "Explore shops and products in your neighborhood."
              : "Connect with retailers in your neighborhood and find unique products from local businesses."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shops"
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition duration-300"
            >
              Explore Shops
            </Link>
            {!user ? (
              <Link
                href="/signin"
                className="bg-transparent hover:bg-emerald-700 border border-white font-semibold py-3 px-8 rounded-lg transition duration-300"
              >
                Sign In
              </Link>
            ) : (
              <Link
                href="/profile"
                className="bg-transparent hover:bg-emerald-700 border border-white font-semibold py-3 px-8 rounded-lg transition duration-300"
              >
                My Profile
              </Link>
            )}
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 100"
            fill="#f9fafb"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
          </svg>
        </div>
      </section>

      {/* User Information Section (if logged in) */}
      {user && mongoUser && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-3">Your Profile</h2>
                  <p>
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p>
                    <span className="font-medium">Role:</span> {mongoUser.role}
                  </p>
                  <p>
                    <span className="font-medium">Member Since:</span>{" "}
                    {mongoUser.createdAt
                      ? new Date(mongoUser.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <div className="mt-4">
                    <Link
                      href="/profile"
                      className="text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-emerald-300 font-medium rounded-lg text-sm px-4 py-2 text-center"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/products"
                        className="text-emerald-600 hover:underline"
                      >
                        Browse Products
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/shops"
                        className="text-emerald-600 hover:underline"
                      >
                        Explore Local Shops
                      </Link>
                    </li>
                    {mongoUser.role === "admin" && (
                      <li>
                        <Link
                          href="/admin"
                          className="text-emerald-600 hover:underline"
                        >
                          Admin Dashboard
                        </Link>
                      </li>
                    )}
                    {mongoUser.role === "retailer" && (
                      <li>
                        <Link
                          href="/retailer"
                          className="text-emerald-600 hover:underline"
                        >
                          Retailer Dashboard
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose LocalLens?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Local</h3>
              <p className="text-gray-600">
                Find businesses in your neighborhood and support your local
                economy.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Shop Unique Products
              </h3>
              <p className="text-gray-600">
                Access unique and handcrafted items that you won't find in big
                chain stores.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust & Safety</h3>
              <p className="text-gray-600">
                Verified retailers and secure transactions for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Shops Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Shops</h2>
            <Link href="/shops" className="text-emerald-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredShops.map((shop) => (
              <div
                key={shop.id}
                className="bg-gray-50 rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]"
              >
                <div className="h-48 w-full bg-gray-200"></div>
                <div className="p-4">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full">
                    {shop.category}
                  </span>
                  <h3 className="text-xl font-semibold mt-2">{shop.name}</h3>
                  <Link
                    href={`/shops/${shop.id}`}
                    className="mt-4 inline-block text-sm text-emerald-600 hover:underline"
                  >
                    View Shop →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Popular Products</h2>
            <Link href="/products" className="text-emerald-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]"
              >
                <div className="h-48 w-full bg-gray-200"></div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-emerald-600 font-medium mt-1">
                    ₹{product.price}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      View Details →
                    </Link>
                    <button className="bg-emerald-600 text-white py-1 px-3 rounded-lg text-sm hover:bg-emerald-700 transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to explore your neighborhood?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join LocalLens today and discover the best local shops and
              products in your area.
            </p>
            <Link
              href="/signin"
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition duration-300"
            >
              Get Started
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
