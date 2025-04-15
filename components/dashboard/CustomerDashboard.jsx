"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Search, ShoppingCart } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import CartDrawer from "@/components/cart/CartDrawer";

export default function CustomerDashboard() {
  const { user, mongoUser } = useAuth();
  const { isCartOpen, setIsCartOpen, getTotalCartItems } = useCart();

  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [errors, setErrors] = useState({
    shops: false,
    featuredProducts: false,
    trendingProducts: false,
    categories: false,
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          // Set default location (Mumbai)
          setLocation({
            latitude: 19.076,
            longitude: 72.8777,
          });
        }
      );
    } else {
      setIsLocating(false);
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch data based on location
  useEffect(() => {
    if (location) {
      fetchNearbyData();
    }
  }, [location]);

  // Handle banner carousel rotation
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      const delaySearch = setTimeout(() => {
        searchProducts(searchQuery);
      }, 500);

      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchNearbyData = async () => {
    setIsLoading(true);

    // Fetch banner data from API
    try {
      const bannerResponse = await fetch("/api/banners");
      if (bannerResponse.ok) {
        const bannerData = await bannerResponse.json();
        setBanners(bannerData);
      } else {
        console.error("Failed to fetch banner data");
        // Fallback to empty banners array
        setBanners([]);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      setBanners([]);
    }

    let fetchErrors = { ...errors };

    try {
      // Fetch nearby shops
      console.log(
        `Fetching shops with location: lat=${location.latitude}, lng=${location.longitude}`
      );
      const shopsResponse = await fetch(
        `/api/shops?lat=${location.latitude}&lng=${location.longitude}&radius=5`
      );

      if (!shopsResponse.ok) {
        console.error("Failed to fetch shops:", await shopsResponse.text());
        throw new Error("Failed to fetch nearby shops");
      }

      const shopsData = await shopsResponse.json();
      console.log("Shops data received:", shopsData.length, "shops");
      setNearbyShops(shopsData);
      fetchErrors.shops = false;

      // Fetch categories
      try {
        const categoriesResponse = await fetch("/api/products/categories");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (Array.isArray(categoriesData) && categoriesData.length > 0) {
            setCategories(categoriesData);
            fetchErrors.categories = false;
          } else {
            // Handle empty response
            setCategories([]);
            fetchErrors.categories = true;
          }
        } else {
          throw new Error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
        fetchErrors.categories = true;
      }

      // Fetch featured products
      try {
        const featuredResponse = await fetch(
          `/api/products/featured?lat=${location.latitude}&lng=${location.longitude}`
        );

        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json();
          console.log(
            "Featured products received:",
            featuredData.products?.length || 0
          );

          if (featuredData.products && featuredData.products.length > 0) {
            setFeaturedProducts(featuredData.products);
            fetchErrors.featuredProducts = false;
          } else {
            // Handle empty response
            setFeaturedProducts([]);
            fetchErrors.featuredProducts = false;
          }
        } else {
          throw new Error("Failed to fetch featured products");
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
        setFeaturedProducts([]);
        fetchErrors.featuredProducts = true;
      }

      // Fetch trending products
      try {
        const trendingResponse = await fetch(
          `/api/products/trending?lat=${location.latitude}&lng=${location.longitude}`
        );

        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json();
          console.log(
            "Trending products received:",
            trendingData.products?.length || 0
          );

          if (trendingData.products && trendingData.products.length > 0) {
            setTrendingProducts(trendingData.products);
            fetchErrors.trendingProducts = false;
          } else {
            // Handle empty response
            setTrendingProducts([]);
            fetchErrors.trendingProducts = false;
          }
        } else {
          throw new Error("Failed to fetch trending products");
        }
      } catch (error) {
        console.error("Error fetching trending products:", error);
        setTrendingProducts([]);
        fetchErrors.trendingProducts = true;
      }
    } catch (error) {
      console.error("Error in fetchNearbyData:", error);
      fetchErrors.shops = true;
    } finally {
      setErrors(fetchErrors);
      setIsLoading(false);
    }
  };

  const searchProducts = async (query) => {
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to search products");
      }

      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter products by category
  const getFilteredProducts = (products) => {
    if (selectedCategory === "all") return products;
    return products.filter((product) => product.category === selectedCategory);
  };

  // Content loading skeletons
  const ShopSkeleton = () => (
    <div className="flex-shrink-0 w-64 rounded-lg bg-white shadow-md overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-200"></div>
      <div className="p-3">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  const ProductSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="flex justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded-full w-8"></div>
        </div>
      </div>
    </div>
  );

  const BannerSkeleton = () => (
    <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
  );

  // Calculate distance from user's location
  const getDistance = (shop) => {
    if (!shop.distance) return "Unknown";
    return shop.distance < 1
      ? `${(shop.distance * 1000).toFixed(0)}m`
      : `${shop.distance.toFixed(1)}km`;
  };

  // Helper function for shop card to handle missing images
  const renderShopImage = (shop) => {
    if (shop.logo) {
      return (
        <div className="h-36 bg-gray-200 relative">
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-100 text-emerald-600">
            <span className="text-lg font-medium">{shop.name.charAt(0)}</span>
          </div>
          {/* Using next/image with error handling */}
          <Image
            src={shop.logo}
            alt={shop.name}
            fill
            className="object-cover"
            onError={(e) => {
              // If image fails to load, the fallback is already displayed
              e.target.style.display = "none";
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-t from-black/60 to-transparent">
            <div className="px-2 py-1 text-xs text-white bg-emerald-600 rounded-full">
              {shop.categories && shop.categories.length > 0
                ? shop.categories[0]
                : "Shop"}
            </div>
            <div className="flex items-center text-white">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="text-xs">{getDistance(shop)}</span>
            </div>
          </div>
          {!shop.isActive && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Closed
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="h-36 bg-emerald-100 relative">
          <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
            <span className="text-lg font-medium">{shop.name.charAt(0)}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-t from-black/60 to-transparent">
            <div className="px-2 py-1 text-xs text-white bg-emerald-600 rounded-full">
              {shop.categories && shop.categories.length > 0
                ? shop.categories[0]
                : "Shop"}
            </div>
            <div className="flex items-center text-white">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="text-xs">{getDistance(shop)}</span>
            </div>
          </div>
          {!shop.isActive && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Closed
            </div>
          )}
        </div>
      );
    }
  };

  // Update the shop card to better handle missing images
  const ShopCard = ({ shop }) => (
    <Link
      key={shop._id}
      href={`/shops/${shop._id}`}
      className="flex-shrink-0 w-64 rounded-lg bg-white shadow-md overflow-hidden hover:shadow-lg transition-transform hover:scale-[1.02]"
    >
      {renderShopImage(shop)}

      <div className="p-3">
        <h3 className="font-medium text-gray-900">{shop.name}</h3>
        <div className="flex items-center mt-1">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs text-gray-600 ml-1">
            {shop.avgRating || "New"}
          </span>
        </div>
      </div>
    </Link>
  );

  // Empty and error state components
  const EmptyState = ({ message, icon }) => (
    <div className="col-span-full py-10 text-center">
      <div className="flex flex-col items-center justify-center">
        {icon}
        <p className="text-gray-500 mt-4">{message}</p>
      </div>
    </div>
  );

  const ErrorState = ({ message, retryFn }) => (
    <div className="col-span-full py-10 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="h-12 w-12 text-red-500 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
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
        <p className="text-gray-700 mb-4">{message}</p>
        {retryFn && (
          <button
            onClick={retryFn}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 md:px-10">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalCartItems() > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                  {getTotalCartItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Welcome message */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.displayName || "Guest"}!
        </h1>
        <p className="text-gray-600">
          Discover amazing products from local shops near you
        </p>
      </div>

      {/* Banner carousel */}
      <div className="mb-8 relative overflow-hidden rounded-xl">
        {isLoading ? (
          <BannerSkeleton />
        ) : (
          <div className="relative h-64 rounded-xl overflow-hidden">
            {banners.length > 0 && (
              <>
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${banners[currentBannerIndex].backgroundColor} opacity-80 transition-opacity duration-500`}
                ></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4 md:px-10">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {banners[currentBannerIndex].title}
                    </h2>
                    <p className="text-white mb-4 max-w-md">
                      {banners[currentBannerIndex].description}
                    </p>
                    <Link
                      href={banners[currentBannerIndex].link}
                      className="bg-white text-emerald-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                    >
                      Explore Now
                    </Link>
                  </div>
                </div>
                {/* Banner pagination dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`h-2 w-2 rounded-full ${
                        index === currentBannerIndex
                          ? "bg-white"
                          : "bg-white/50"
                      }`}
                      aria-label={`Go to banner ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Category filters */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            All Categories
          </button>

          {errors.categories && !isLoading ? (
            <div className="px-4 py-2 text-red-500">
              Failed to load categories
            </div>
          ) : (
            categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Nearby shops section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Shops Near You</h2>
          <Link
            href="/shops"
            className="text-emerald-600 hover:text-emerald-700"
          >
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {Array(4)
              .fill()
              .map((_, index) => (
                <ShopSkeleton key={index} />
              ))}
          </div>
        ) : errors.shops ? (
          <ErrorState
            message="Unable to load shops near you. Please try again."
            retryFn={() => fetchNearbyData()}
          />
        ) : nearbyShops.length === 0 ? (
          <EmptyState
            message="No shops found nearby. Try expanding your search radius."
            icon={
              <div className="h-12 w-12 text-gray-400">
                <MapPin className="h-full w-full" />
              </div>
            }
          />
        ) : (
          <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {nearbyShops.map((shop) => (
              <ShopCard key={shop._id} shop={shop} />
            ))}
          </div>
        )}
      </div>

      {/* Featured products section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <Link
            href="/products"
            className="text-emerald-600 hover:text-emerald-700"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            // Show skeletons during loading
            Array(8)
              .fill()
              .map((_, index) => <ProductSkeleton key={index} />)
          ) : errors.featuredProducts ? (
            <ErrorState
              message="Unable to load featured products. Please try again."
              retryFn={() => fetchNearbyData()}
            />
          ) : getFilteredProducts(featuredProducts).length === 0 ? (
            <EmptyState
              message={
                selectedCategory === "all"
                  ? "No featured products available at the moment."
                  : `No featured products available in the ${selectedCategory} category.`
              }
              icon={
                <div className="h-12 w-12 text-gray-400">
                  <Star className="h-full w-full" />
                </div>
              }
            />
          ) : (
            getFilteredProducts(featuredProducts).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </div>
      </div>

      {/* Trending products section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Trending Now</h2>
          <Link
            href="/trending"
            className="text-emerald-600 hover:text-emerald-700"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            // Show skeletons during loading
            Array(4)
              .fill()
              .map((_, index) => <ProductSkeleton key={index} />)
          ) : errors.trendingProducts ? (
            <ErrorState
              message="Unable to load trending products. Please try again."
              retryFn={() => fetchNearbyData()}
            />
          ) : getFilteredProducts(trendingProducts).length === 0 ? (
            <EmptyState
              message={
                selectedCategory === "all"
                  ? "No trending products available at the moment."
                  : `No trending products available in the ${selectedCategory} category.`
              }
              icon={
                <div className="h-12 w-12 text-gray-400">
                  <ShoppingCart className="h-full w-full" />
                </div>
              }
            />
          ) : (
            // Show only the first 3 trending products
            getFilteredProducts(trendingProducts)
              .slice(0, 3)
              .map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
          )}
        </div>
      </div>
    </div>
  );
}
