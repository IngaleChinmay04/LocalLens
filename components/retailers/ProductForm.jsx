"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Plus,
  Minus,
  X,
  Image as ImageIcon,
  Tag,
  Calendar,
  Info,
} from "lucide-react";

export default function ProductForm({ product, shopId, isEditing = false }) {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(shopId || "");
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantTypes, setVariantTypes] = useState([
    { name: "", options: [""] },
  ]);
  const [isPreBookable, setIsPreBookable] = useState(false);
  const [isPreBuyable, setIsPreBuyable] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    subcategory: "",
    basePrice: "",
    discountPercentage: "",
    tax: "",
    currency: "INR",
    availableQuantity: "",
    sku: "",
    weight: "",
    dimensions: { length: "", width: "", height: "" },
    isActive: true,
  });
  const [preBookConfig, setPreBookConfig] = useState({
    startDate: "",
    endDate: "",
    limitPerCustomer: 1,
    instructions: "",
  });
  const [preBuyConfig, setPreBuyConfig] = useState({
    expectedDeliveryDate: "",
    earlyAccessDiscount: 0,
    limitPerCustomer: 1,
    instructions: "",
  });

  const productCategories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Groceries",
    "Beauty & Personal Care",
    "Books",
    "Sports & Outdoors",
    "Toys & Games",
    "Handicrafts",
    "Jewelry",
    "Other",
  ];

  useEffect(() => {
    if (isEditing && product) {
      // Populate form with product data
      setFormData({
        name: product.name || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        basePrice: product.basePrice?.toString() || "",
        discountPercentage: product.discountPercentage?.toString() || "",
        tax: product.tax?.toString() || "",
        currency: product.currency || "INR",
        availableQuantity: product.availableQuantity?.toString() || "",
        sku: product.sku || "",
        weight: product.weight?.toString() || "",
        dimensions: {
          length: product.dimensions?.length?.toString() || "",
          width: product.dimensions?.width?.toString() || "",
          height: product.dimensions?.height?.toString() || "",
        },
        isActive: product.isActive !== false,
      });

      // Set variant data if any
      if (product.variants && product.variants.length > 0) {
        setHasVariants(true);
        // Reconstruct variant types from product variants
        // This is a simplified approach - you might need more complex logic
        // depending on how your variants are structured
        const extractedVariantTypes = [];
        const variantMap = new Map();

        product.variants.forEach((variant) => {
          if (variant.attributes) {
            Object.keys(variant.attributes).forEach((key) => {
              if (!variantMap.has(key)) {
                variantMap.set(key, new Set());
              }
              variantMap.get(key).add(variant.attributes[key]);
            });
          }
        });

        variantMap.forEach((values, name) => {
          extractedVariantTypes.push({
            name,
            options: Array.from(values),
          });
        });

        if (extractedVariantTypes.length > 0) {
          setVariantTypes(extractedVariantTypes);
        }
      }

      // Set pre-book configuration if applicable
      if (product.isPreBookable) {
        setIsPreBookable(true);
        setPreBookConfig({
          startDate: product.preBookConfig?.startDate
            ? new Date(product.preBookConfig.startDate)
                .toISOString()
                .split("T")[0]
            : "",
          endDate: product.preBookConfig?.endDate
            ? new Date(product.preBookConfig.endDate)
                .toISOString()
                .split("T")[0]
            : "",
          limitPerCustomer: product.preBookConfig?.limitPerCustomer || 1,
          instructions: product.preBookConfig?.instructions || "",
        });
      }

      // Set pre-buy configuration if applicable
      if (product.isPreBuyable) {
        setIsPreBuyable(true);
        setPreBuyConfig({
          expectedDeliveryDate: product.preBuyConfig?.expectedDeliveryDate
            ? new Date(product.preBuyConfig.expectedDeliveryDate)
                .toISOString()
                .split("T")[0]
            : "",
          earlyAccessDiscount: product.preBuyConfig?.earlyAccessDiscount || 0,
          limitPerCustomer: product.preBuyConfig?.limitPerCustomer || 1,
          instructions: product.preBuyConfig?.instructions || "",
        });
      }

      // Set existing images if any
      if (product.images && product.images.length > 0) {
        setImages(product.images);
        setImagePreview(product.images.map((img) => img.url));
      }
    }
  }, [product, isEditing]);

  useEffect(() => {
    // Fetch shops only if no shopId is provided
    if (!shopId) {
      fetchShops();
    }
  }, [shopId]);

  const fetchShops = async () => {
    try {
      setIsLoading(true);
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

      // If shops are fetched and no shop is selected yet, select the first one
      if (data.length > 0 && !selectedShop) {
        setSelectedShop(data[0]._id);
      }
    } catch (error) {
      toast.error("Error fetching shops");
      console.error("Error fetching shops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("dimensions.")) {
      const dimensionKey = name.split(".")[1];
      setFormData({
        ...formData,
        dimensions: {
          ...formData.dimensions,
          [dimensionKey]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handlePreBookConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreBookConfig({
      ...preBookConfig,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePreBuyConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreBuyConfig({
      ...preBuyConfig,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Store the file objects for later upload
    setImageFiles((prev) => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreview((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Remove from both preview and files array
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));

    // If editing and removing an existing image, also update the images array
    if (isEditing && index < images.length) {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addVariantType = () => {
    setVariantTypes([...variantTypes, { name: "", options: [""] }]);
  };

  const removeVariantType = (index) => {
    const newVariantTypes = [...variantTypes];
    newVariantTypes.splice(index, 1);
    setVariantTypes(newVariantTypes);
  };

  const updateVariantTypeName = (index, name) => {
    const newVariantTypes = [...variantTypes];
    newVariantTypes[index].name = name;
    setVariantTypes(newVariantTypes);
  };

  const addVariantOption = (typeIndex) => {
    const newVariantTypes = [...variantTypes];
    newVariantTypes[typeIndex].options.push("");
    setVariantTypes(newVariantTypes);
  };

  const removeVariantOption = (typeIndex, optionIndex) => {
    const newVariantTypes = [...variantTypes];
    newVariantTypes[typeIndex].options.splice(optionIndex, 1);
    setVariantTypes(newVariantTypes);
  };

  const updateVariantOption = (typeIndex, optionIndex, value) => {
    const newVariantTypes = [...variantTypes];
    newVariantTypes[typeIndex].options[optionIndex] = value;
    setVariantTypes(newVariantTypes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const toastId = toast.loading(
        isEditing ? "Updating product..." : "Creating product..."
      );

      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      // Prepare form data
      const productFormData = new FormData();

      // Add base product data
      for (const [key, value] of Object.entries(formData)) {
        if (key !== "dimensions") {
          productFormData.append(key, value);
        }
      }

      // Add dimensions
      for (const [key, value] of Object.entries(formData.dimensions)) {
        productFormData.append(`dimensions[${key}]`, value);
      }

      // Add shop ID
      productFormData.append("shopId", selectedShop || shopId);

      // Add variants if applicable
      if (hasVariants) {
        productFormData.append("hasVariants", "true");
        productFormData.append("variantTypes", JSON.stringify(variantTypes));
      }

      // Add pre-booking config if applicable
      if (isPreBookable) {
        productFormData.append("isPreBookable", "true");
        productFormData.append("preBookConfig", JSON.stringify(preBookConfig));
      }

      // Add pre-buying config if applicable
      if (isPreBuyable) {
        productFormData.append("isPreBuyable", "true");
        productFormData.append("preBuyConfig", JSON.stringify(preBuyConfig));
      }

      // Add images
      if (isEditing) {
        // For edit mode, add existing images that weren't removed
        if (images.length > 0) {
          productFormData.append("existingImages", JSON.stringify(images));
        }
      }

      // Add new image files
      imageFiles.forEach((file) => {
        productFormData.append("images", file);
      });

      // Make API request to create/update product
      const url = isEditing ? `/api/products/${product._id}` : "/api/products";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: productFormData,
      });

      toast.dismiss(toastId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save product");
      }

      toast.success(
        isEditing
          ? "Product updated successfully!"
          : "Product created successfully!"
      );

      // Redirect to product list after successful save
      setTimeout(() => {
        router.push(`/retailer/products?shopId=${selectedShop || shopId}`);
      }, 1000);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Error saving product");
    } finally {
      setIsLoading(false);
    }
  };

  // If no shops are available for selection or if on edit mode but product not loaded yet
  if (!shopId && shops.length === 0 && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!shopId && shops.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
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
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Product" : "Create New Product"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Shop Selection - Only show if no shopId was provided (for creation from dashboard) */}
        {!shopId && (
          <div className="mb-4">
            <label
              htmlFor="shop"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Shop *
            </label>
            <select
              id="shop"
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              required
            >
              <option value="" disabled>
                Select a shop
              </option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                SKU/Product Code
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="shortDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Short Description *
              </label>
              <input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                {productCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="subcategory"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subcategory
              </label>
              <input
                type="text"
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-lg font-medium mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="basePrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Base Price *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="basePrice"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {formData.currency}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="discountPercentage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                id="discountPercentage"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="tax"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tax (%)
              </label>
              <input
                type="number"
                min="0"
                id="tax"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="availableQuantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Available Quantity *
              </label>
              <input
                type="number"
                min="0"
                id="availableQuantity"
                name="availableQuantity"
                value={formData.availableQuantity}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="weight"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="dimensions.length"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Length (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                id="dimensions.length"
                name="dimensions.length"
                value={formData.dimensions.length}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="dimensions.width"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Width (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                id="dimensions.width"
                name="dimensions.width"
                value={formData.dimensions.width}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="dimensions.height"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                id="dimensions.height"
                name="dimensions.height"
                value={formData.dimensions.height}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Status
            </label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Active (visible to customers)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-lg font-medium mb-4">Product Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {imagePreview.map((src, index) => (
              <div
                key={index}
                className="relative rounded-md overflow-hidden h-32"
              >
                <img
                  src={src}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Images
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG or JPEG (MAX. 5MB)
                </p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

        {/* Product Variants */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Product Variants</h2>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={() => setHasVariants(!hasVariants)}
                className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                This product has variants
              </span>
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Define variant types (like Size, Color) and their options (like
                Small/Medium/Large, Red/Blue/Green)
              </p>

              {variantTypes.map((variantType, typeIndex) => (
                <div
                  key={typeIndex}
                  className="border border-gray-200 rounded-md p-4 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-full">
                      <label
                        htmlFor={`variantType-${typeIndex}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Variant Type
                      </label>
                      <input
                        type="text"
                        id={`variantType-${typeIndex}`}
                        value={variantType.name}
                        onChange={(e) =>
                          updateVariantTypeName(typeIndex, e.target.value)
                        }
                        placeholder="e.g. Size, Color"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariantType(typeIndex)}
                      className="ml-2 flex-shrink-0 mt-6 p-1 text-gray-500 hover:text-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="ml-4 mt-2 space-y-2">
                    {variantType.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateVariantOption(
                              typeIndex,
                              optionIndex,
                              e.target.value
                            )
                          }
                          placeholder="Option value"
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeVariantOption(typeIndex, optionIndex)
                          }
                          className="ml-2 p-1 text-gray-500 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addVariantOption(typeIndex)}
                      className="mt-2 flex items-center text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Option
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariantType}
                className="flex items-center text-sm text-emerald-600 hover:text-emerald-700"
              >
                <Plus size={16} className="mr-1" />
                Add Variant Type
              </button>

              <div className="mt-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <Info className="inline mr-1 h-4 w-4" />
                  After creating the product, you'll be able to set specific
                  prices and inventory for each variant combination.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pre-booking Options */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Pre-booking Options</h2>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={isPreBookable}
                onChange={() => setIsPreBookable(!isPreBookable)}
                className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable pre-booking
              </span>
            </label>
          </div>

          {isPreBookable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="preBookStartDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pre-booking Start Date
                </label>
                <input
                  type="date"
                  id="preBookStartDate"
                  name="startDate"
                  value={preBookConfig.startDate}
                  onChange={handlePreBookConfigChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="preBookEndDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pre-booking End Date
                </label>
                <input
                  type="date"
                  id="preBookEndDate"
                  name="endDate"
                  value={preBookConfig.endDate}
                  onChange={handlePreBookConfigChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="preBookLimit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Limit Per Customer
                </label>
                <input
                  type="number"
                  min="1"
                  id="preBookLimit"
                  name="limitPerCustomer"
                  value={preBookConfig.limitPerCustomer}
                  onChange={handlePreBookConfigChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="preBookInstructions"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pre-booking Instructions
                </label>
                <textarea
                  id="preBookInstructions"
                  name="instructions"
                  value={preBookConfig.instructions}
                  onChange={handlePreBookConfigChange}
                  rows={2}
                  placeholder="Special instructions for customers when pre-booking this product"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-700 flex items-start">
                  <Info className="h-4 w-4 mr-1 flex-shrink-0" />
                  Pre-booking allows customers to reserve this product for later
                  in-store pickup. You will need to confirm each pre-booking
                  from your reservations dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pre-buying Options */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Pre-buying Options</h2>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={isPreBuyable}
                onChange={() => setIsPreBuyable(!isPreBuyable)}
                className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable pre-buying
              </span>
            </label>
          </div>

          {isPreBuyable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expectedDeliveryDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  id="expectedDeliveryDate"
                  name="expectedDeliveryDate"
                  value={preBuyConfig.expectedDeliveryDate}
                  onChange={handlePreBuyConfigChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="earlyAccessDiscount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Early Access Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  id="earlyAccessDiscount"
                  name="earlyAccessDiscount"
                  value={preBuyConfig.earlyAccessDiscount}
                  onChange={handlePreBuyConfigChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="preBuyLimit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Limit Per Customer
                </label>
                <input
                  type="number"
                  min="1"
                  id="preBuyLimit"
                  name="limitPerCustomer"
                  value={preBuyConfig.limitPerCustomer}
                  onChange={handlePreBuyConfigChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="preBuyInstructions"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pre-buying Instructions
                </label>
                <textarea
                  id="preBuyInstructions"
                  name="instructions"
                  value={preBuyConfig.instructions}
                  onChange={handlePreBuyConfigChange}
                  rows={2}
                  placeholder="Special instructions for customers about pre-buying this product"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-700 flex items-start">
                  <Info className="h-4 w-4 mr-1 flex-shrink-0" />
                  Pre-buying allows customers to purchase this product before
                  it's in stock. When new stock arrives, these customers will
                  get priority access to the product.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            disabled={isLoading}
          >
            {isLoading
              ? "Saving..."
              : isEditing
              ? "Update Product"
              : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
