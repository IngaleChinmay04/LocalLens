"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RetailerLayout from "@/components/layouts/RetailerLayout";
import { toast } from "react-hot-toast";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Filter,
  Package,
  Calendar,
} from "lucide-react";

export default function ProductsPage() {
  const { user, mongoUser, loading, getIdToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopIdParam = searchParams.get("shopId");

  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(shopIdParam || "");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    if (!loading && (!user || (mongoUser && mongoUser.role !== "retailer"))) {
      router.push("/");
    } else if (user && mongoUser && mongoUser.role === "retailer") {
      fetchShops();
    }
  }, [user, mongoUser, loading, router]);

  useEffect(() => {
    if (shopIdParam && shopIdParam !== selectedShop) {
      setSelectedShop(shopIdParam);
    }
  }, [shopIdParam]);

  useEffect(() => {
    if (selectedShop) {
      fetchProducts();
    }
  }, [
    selectedShop,
    currentPage,
    itemsPerPage,
    sortField,
    sortOrder,
    categoryFilter,
    activeFilter,
    searchParams, // Add this to watch for URL search params changes
  ]);

  useEffect(() => {
    // Check for filter parameter in URL
    const filterParam = searchParams.get("filter");
    if (filterParam === "featured" || filterParam === "trending") {
      setFilterType(filterParam);
    } else {
      setFilterType("");
    }
  }, [searchParams]);

  const fetchShops = async () => {
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch("/api/retailers/shops", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch shops");
      }

      const data = await response.json();
      setShops(data);

      // If no shop is selected yet but we have shops, select the first one
      if (!selectedShop && data.length > 0) {
        setSelectedShop(data[0]._id);

        // Update URL with shopId parameter
        const url = new URL(window.location);
        url.searchParams.set("shopId", data[0]._id);
        window.history.pushState({}, "", url);
      }
    } catch (error) {
      toast.error("Error fetching shops");
      console.error("Error fetching shops:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      // Construct URL with parameters
      let url = `/api/products?shopId=${selectedShop}&page=${currentPage}&limit=${itemsPerPage}&sort=${sortField}&order=${sortOrder}`;

      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (activeFilter !== "all") {
        url += `&isActive=${activeFilter === "active"}`;
      }

      // Add filter for featured or trending products
      if (filterType === "featured") {
        url += "&isFeatured=true";
      } else if (filterType === "trending") {
        url += "&isTrending=true";
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      toast.error("Error fetching products");
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleShopChange = (e) => {
    const newShopId = e.target.value;
    setSelectedShop(newShopId);

    // Reset pagination
    setCurrentPage(1);

    // Update URL with new shopId parameter
    const url = new URL(window.location);
    url.searchParams.set("shopId", newShopId);
    window.history.pushState({}, "", url);
  };

  const handleDeleteProduct = async (productId) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Error deleting product");
      console.error("Error deleting product:", error);
    }
  };

  const toggleProductFeatured = async (productId, currentValue) => {
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isFeatured: !currentValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      // Update the product in the state
      setProducts(
        products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: !product.isFeatured }
            : product
        )
      );

      toast.success(
        `Product ${
          !currentValue ? "marked as featured" : "removed from featured"
        }`
      );
    } catch (error) {
      toast.error("Error updating product");
      console.error("Error updating product:", error);
    }
  };

  const toggleProductTrending = async (productId, currentValue) => {
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isTrending: !currentValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      // Update the product in the state
      setProducts(
        products.map((product) =>
          product._id === productId
            ? { ...product, isTrending: !product.isTrending }
            : product
        )
      );

      toast.success(
        `Product ${
          !currentValue ? "marked as trending" : "removed from trending"
        }`
      );
    } catch (error) {
      toast.error("Error updating product");
      console.error("Error updating product:", error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const calculateFinalPrice = (basePrice, discountPercentage) => {
    if (!discountPercentage) return basePrice;
    const discountAmount = (basePrice * discountPercentage) / 100;
    return (basePrice - discountAmount).toFixed(2);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5; // Adjust as needed
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Add first page and prev indicator
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 py-1">
            ...
          </span>
        );
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            i === currentPage
              ? "bg-emerald-600 text-white"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Add last page and next indicator
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 py-1">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key="last"
          className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {products.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  currentPage * itemsPerPage,
                  (currentPage - 1) * itemsPerPage + products.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">{totalPages * itemsPerPage}</span>{" "}
              results
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="flex items-center space-x-1">{pages}</div>

              <button
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (!user || !mongoUser || mongoUser.role !== "retailer") {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">
          You need to be logged in as a retailer to access this page.
        </p>
        <Link
          href="/"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <RetailerLayout>
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Products</h1>
          <div className="flex items-center space-x-4">
            <Link
              href={`/retailer/products/new${
                selectedShop ? `?shopId=${selectedShop}` : ""
              }`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Shop Selection */}
              <div>
                <label
                  htmlFor="shop"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select Shop
                </label>
                <select
                  id="shop"
                  value={selectedShop}
                  onChange={handleShopChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                >
                  <option value="" disabled>
                    Select a shop
                  </option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name} {!shop.isVerified && "(Pending Verification)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Form */}
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Products
                </label>
                <form
                  onSubmit={handleSearchSubmit}
                  className="mt-1 flex rounded-md shadow-sm"
                >
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-emerald-500 focus:border-emerald-500 flex-1 block w-full rounded-l-md sm:text-sm border-gray-300"
                    placeholder="Search by name or description"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filters
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={activeFilter}
                    onChange={(e) => {
                      setActiveFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Beauty & Personal Care">
                      Beauty & Personal Care
                    </option>
                    <option value="Books">Books</option>
                    <option value="Sports & Outdoors">Sports & Outdoors</option>
                    <option value="Toys & Games">Toys & Games</option>
                    <option value="Handicrafts">Handicrafts</option>
                    <option value="Jewelry">Jewelry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {!selectedShop && (
            <div className="p-6 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Shop Selected
              </h3>
              <p className="text-gray-500 mb-4">
                Please select a shop to view its products.
              </p>
            </div>
          )}

          {selectedShop && isLoading && (
            <div className="p-6 text-center">
              <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading products...</p>
            </div>
          )}

          {selectedShop && !isLoading && products.length === 0 && (
            <div className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter || activeFilter !== "all"
                  ? "No products match your search or filters."
                  : "You haven't added any products to this shop yet."}
              </p>
              <Link
                href={`/retailer/products/new?shopId=${selectedShop}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Your First Product
              </Link>
            </div>
          )}

          {selectedShop && !isLoading && products.length > 0 && (
            <>
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
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Stock
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Special Offers
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {product.images && product.images[0] ? (
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={product.images[0].url}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.hasVariants
                                  ? `${product.variants?.length || 0} variants`
                                  : "No variants"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.category}
                          </div>
                          {product.subcategory && (
                            <div className="text-sm text-gray-500">
                              {product.subcategory}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₹
                            {calculateFinalPrice(
                              product.basePrice,
                              product.discountPercentage
                            )}
                          </div>
                          {product.discountPercentage > 0 && (
                            <div className="text-sm line-through text-gray-500">
                              ₹{product.basePrice}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.availableQuantity}
                            {product.hasVariants && " (total)"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {product.isPreBookable && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Calendar className="h-3 w-3 mr-1" />
                                Pre-Book
                              </span>
                            )}
                            {product.isPreBuyable && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <ShoppingBag className="h-3 w-3 mr-1" />
                                Pre-Buy
                              </span>
                            )}
                            <button
                              onClick={() =>
                                toggleProductFeatured(
                                  product._id,
                                  product.isFeatured
                                )
                              }
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.isFeatured
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {product.isFeatured ? "Featured" : "Feature"}
                            </button>
                            <button
                              onClick={() =>
                                toggleProductTrending(
                                  product._id,
                                  product.isTrending
                                )
                              }
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.isTrending
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {product.isTrending ? "Trending" : "Set Trending"}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/retailer/products/${product._id}/edit`}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            <Edit className="h-5 w-5 inline" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
                            <Trash2 className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </RetailerLayout>
  );
}
