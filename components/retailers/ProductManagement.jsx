"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash,
  Tag,
  Layers,
  EyeOff,
} from "lucide-react";

export default function ProductManagement({ shopId }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(shopId || "");
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
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
    async function fetchProducts() {
      if (!selectedShop) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/shops/${selectedShop}/products`);

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(data.map((product) => product.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        toast.error("Error fetching products");
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [selectedShop]);

  const handleShopChange = (e) => {
    setSelectedShop(e.target.value);
    router.push(`/retailer/products?shopId=${e.target.value}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleCreateProduct = () => {
    router.push(`/retailer/products/new?shopId=${selectedShop}`);
  };

  const handleEditProduct = (productId) => {
    router.push(`/retailer/products/${productId}/edit`);
  };

  const handleViewVariants = (productId) => {
    router.push(`/retailer/products/${productId}/variants`);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts(products.filter((product) => product._id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Error deleting product");
      console.error("Error deleting product:", error);
    }
  };

  const toggleProductAvailability = async (productId, currentValue) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAvailable: !currentValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product availability");
      }

      setProducts(
        products.map((product) =>
          product._id === productId
            ? { ...product, isAvailable: !product.isAvailable }
            : product
        )
      );

      toast.success(
        `Product ${!currentValue ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      toast.error("Error updating product");
      console.error("Error updating product:", error);
    }
  };

  if (shops.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Verified Shops
        </h3>
        <p className="text-gray-600 mb-4">
          You need at least one verified shop to manage products.
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
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-600">Manage your shop products</p>
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

          <button
            onClick={handleCreateProduct}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-1" />
            Add Product
          </button>
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
                placeholder="Search products..."
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No products found
            </h3>
            <p className="text-gray-500 mb-4">
              {products.length === 0
                ? "You haven't added any products yet."
                : "No products match your filters."}
            </p>
            {products.length === 0 && (
              <button
                onClick={handleCreateProduct}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-1" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
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
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {product.images?.length > 0 ? (
                            <img
                              src={product.images[0].url}
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
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{product.basePrice.toFixed(2)}
                      </div>
                      {product.discountPercentage > 0 && (
                        <div className="text-xs text-emerald-600">
                          {product.discountPercentage}% off
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.availableQuantity}
                      </div>
                      {product.hasVariants && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Layers className="h-3 w-3 mr-1" />
                          Has variants
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.isAvailable ? "Active" : "Inactive"}
                      </span>
                      {product.isPreBookable && (
                        <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Pre-bookable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            toggleProductAvailability(
                              product._id,
                              product.isAvailable
                            )
                          }
                          className={`p-1 rounded-full ${
                            product.isAvailable
                              ? "text-gray-500 hover:bg-gray-100"
                              : "text-green-500 hover:bg-green-100"
                          }`}
                          title={
                            product.isAvailable
                              ? "Disable product"
                              : "Enable product"
                          }
                        >
                          <EyeOff className="h-5 w-5" />
                        </button>
                        {product.hasVariants && (
                          <button
                            onClick={() => handleViewVariants(product._id)}
                            className="p-1 rounded-full text-indigo-500 hover:bg-indigo-100"
                            title="Manage variants"
                          >
                            <Layers className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditProduct(product._id)}
                          className="p-1 rounded-full text-blue-500 hover:bg-blue-100"
                          title="Edit product"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="p-1 rounded-full text-red-500 hover:bg-red-100"
                          title="Delete product"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
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
