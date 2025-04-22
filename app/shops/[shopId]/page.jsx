"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  ShoppingBag,
  Store,
  Info,
} from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

export default function ShopDetailsPage() {
  const { shopId } = useParams();
  const router = useRouter();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("products"); // products, about, reviews

  // Fetch shop data
  useEffect(() => {
    async function fetchShopData() {
      setIsLoading(true);
      try {
        // Fetch shop details
        const response = await fetch(`/api/shops/${shopId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch shop details");
        }

        const data = await response.json();
        setShop(data);

        // Fetch products from this shop
        const productsResponse = await fetch(`/api/products?shopId=${shopId}`);

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          // Fix: Access the products array from the response object
          setProducts(productsData.products || []);

          // Extract categories from products
          const uniqueCategories = [
            ...new Set(
              (productsData.products || [])
                .map((product) => product.category)
                .filter(Boolean)
            ),
          ];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Error fetching shop data:", error);
        toast.error("Could not load shop details");

        // Fallback mock data for development
        setShop({
          _id: shopId,
          name: "Sample Shop",
          description:
            "This is a detailed description of the sample shop. It's not the real shop data because there was an error loading the data from the API.",
          address: {
            street: "123 Main Street",
            city: "Sample City",
            state: "Sample State",
            zip: "123456",
          },
          contact: {
            phone: "+91 9876543210",
            email: "sampleshop@example.com",
          },
          businessHours: [
            { day: "Monday", open: "09:00", close: "18:00", isClosed: false },
            { day: "Tuesday", open: "09:00", close: "18:00", isClosed: false },
            {
              day: "Wednesday",
              open: "09:00",
              close: "18:00",
              isClosed: false,
            },
            { day: "Thursday", open: "09:00", close: "18:00", isClosed: false },
            { day: "Friday", open: "09:00", close: "18:00", isClosed: false },
            { day: "Saturday", open: "10:00", close: "16:00", isClosed: false },
            { day: "Sunday", open: "", close: "", isClosed: true },
          ],
          avgRating: 4.2,
          reviewCount: 18,
          images: [{ url: "/assets/shop1.jpg" }],
          isActive: true,
          isVerified: true,
          category: "General Store",
        });

        // Mock products
        const mockProducts = [
          {
            _id: "product1",
            name: "Sample Product 1",
            basePrice: 199.99,
            discountPercentage: 10,
            category: "Electronics",
            images: [{ url: "/assets/product1.jpg" }],
            shopName: "Sample Shop",
            shopId: shopId,
            avgRating: 4.5,
            reviewCount: 12,
          },
          {
            _id: "product2",
            name: "Sample Product 2",
            basePrice: 129.99,
            discountPercentage: 0,
            category: "Clothing",
            images: [{ url: "/assets/product2.jpg" }],
            shopName: "Sample Shop",
            shopId: shopId,
            avgRating: 4.0,
            reviewCount: 8,
          },
        ];

        setProducts(mockProducts);
        setCategories(["Electronics", "Clothing"]);
      } finally {
        setIsLoading(false);
      }
    }

    if (shopId) {
      fetchShopData();
    }
  }, [shopId]);

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === "" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle category filter change
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Check if the shop is currently open
  const isShopCurrentlyOpen = () => {
    if (!shop || !shop.businessHours) return false;

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = shop.businessHours.find(
      (hours) => hours.day === dayOfWeek
    );

    if (!todayHours || todayHours.isClosed) return false;

    const [openHour, openMinute] = todayHours.open.split(":").map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(":").map(Number);

    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    return currentTime >= openTime && currentTime < closeTime;
  };

  // Format business hours for display
  const formatBusinessHours = (hours) => {
    if (!hours) return "Not available";

    if (hours.isClosed) return "Closed";

    return `${hours.open} - ${hours.close}`;
  };

  // Generate stars for rating
  const generateStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} fill="#FFD700" stroke="#FFD700" size={16} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="text-gray-300" size={16} />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star fill="#FFD700" stroke="#FFD700" size={16} />
          </div>
        </div>
      );
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="text-gray-300" size={16} />
      );
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Shop Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The shop you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-emerald-600"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-emerald-600">
            Home
          </Link>
          <ChevronRight size={16} className="mx-1" />
          <Link href="/shops" className="hover:text-emerald-600">
            Shops
          </Link>
          <ChevronRight size={16} className="mx-1" />
          <span className="text-gray-700">{shop.name}</span>
        </div>
      </div>

      {/* Shop Header */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative h-48 bg-gray-300">
            {shop.coverImage ? (
              <Image
                src={shop.coverImage.url}
                alt={shop.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600">
                <h1 className="text-3xl font-bold text-white text-center px-4">
                  {shop.name}
                </h1>
              </div>
            )}

            {/* Verification Badge */}
            {shop.isVerified && (
              <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md">
                <div className="text-emerald-500 flex items-center font-medium text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </div>
              </div>
            )}

            {/* Status Badge - Only show "Open Now" when shop is open */}
            {/* <div className="absolute bottom-4 right-4">
              {isShopCurrentlyOpen() && (
                <div className="rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800">
                  Open Now
                </div>
              )}
            </div> */}
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {shop.name}
                </h1>
                {shop.category && (
                  <p className="text-gray-600 mt-1">{shop.category}</p>
                )}
              </div>

              <div className="flex items-center mt-2 md:mt-0">
                <div className="flex mr-1">
                  {generateStars(shop.avgRating || 0)}
                </div>
                <span className="text-sm text-gray-500">
                  ({shop.reviewCount || 0} reviews)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {shop.address && (
                <div className="flex items-start">
                  <MapPin
                    size={16}
                    className="text-emerald-500 mt-0.5 mr-1 flex-shrink-0"
                  />
                  <span>
                    {shop.address.street}, {shop.address.city},{" "}
                    {shop.address.state} {shop.address.zip}
                  </span>
                </div>
              )}

              {shop.contact?.phone && (
                <div className="flex items-center">
                  <Phone size={16} className="text-emerald-500 mr-1" />
                  <span>{shop.contact.phone}</span>
                </div>
              )}

              {shop.contact?.email && (
                <div className="flex items-center">
                  <Mail size={16} className="text-emerald-500 mr-1" />
                  <span>{shop.contact.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shop Tabs */}
      <div className="container mx-auto px-4 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("products")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "products"
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Products
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "about"
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              About
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "reviews"
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reviews
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4">
        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {/* Search and Filters */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="block w-full pl-10 pr-3 py-2 border rounded-md"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={handleCategoryFilterChange}
                    className="block w-full pl-10 pr-3 py-2 border rounded-md"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter
                    ? "Try adjusting your search or filter criteria."
                    : "This shop hasn't added any products yet."}
                </p>
              </div>
            )}
          </>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About {shop.name}
            </h2>

            {shop.description && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-2">
                  Description
                </h3>
                <p className="text-gray-600">{shop.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Business Hours
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="space-y-2">
                  {shop.businessHours?.map((hours, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="font-medium">{hours.day}</span>
                      <span
                        className={
                          hours.isClosed ? "text-red-600" : "text-gray-600"
                        }
                      >
                        {formatBusinessHours(hours)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {shop.address && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-2">
                  Location
                </h3>
                <div className="bg-gray-50 p-4 rounded-md flex items-start">
                  <MapPin
                    size={18}
                    className="text-emerald-500 mt-0.5 mr-2 flex-shrink-0"
                  />
                  <p className="text-gray-600">
                    {shop.address.street}, {shop.address.city}
                    <br />
                    {shop.address.state} {shop.address.zip}
                  </p>
                </div>
              </div>
            )}

            {(shop.contact?.phone || shop.contact?.email) && (
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">
                  Contact Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  {shop.contact?.phone && (
                    <div className="flex items-center">
                      <Phone size={18} className="text-emerald-500 mr-2" />
                      <span className="text-gray-600">
                        {shop.contact.phone}
                      </span>
                    </div>
                  )}

                  {shop.contact?.email && (
                    <div className="flex items-center">
                      <Mail size={18} className="text-emerald-500 mr-2" />
                      <span className="text-gray-600">
                        {shop.contact.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Customer Reviews
              </h2>

              <div className="flex items-center">
                <div className="flex mr-2">
                  {generateStars(shop.avgRating || 0)}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {shop.avgRating ? shop.avgRating.toFixed(1) : "0.0"} out of 5
                </span>
              </div>
            </div>

            {/* Reviews will be fetched and displayed here */}
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-500">
                Be the first to review this shop after making a purchase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
