"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  ChevronRight,
  ArrowLeft,
  Star,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Share,
  Truck,
  Clock,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useCart } from "@/lib/context/CartContext";

export default function ProductDetails() {
  const { productId } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description"); // description, specifications, reviews

  // Fetch product data
  useEffect(() => {
    async function fetchProductData() {
      setIsLoading(true);

      try {
        // Fetch product details
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch product details");
        }

        const data = await response.json();
        setProduct(data);

        // If product has a default selected variant, set it
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }

        // Fetch shop details if product has shopId
        if (data.shopId) {
          const shopResponse = await fetch(`/api/shops/${data.shopId}`);
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            setShop(shopData);
          } else {
            console.error("Error fetching shop data");
            // Set shop to null instead of using mock data
            setShop(null);
          }
        }

        // Fetch related products
        const relatedResponse = await fetch(
          `/api/products?category=${data.category}&limit=4&exclude=${data._id}`
        );
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          setRelatedProducts(relatedData.products || []);
        } else {
          console.error("Error fetching related products");
          // Set empty array instead of mock data
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        toast.error("Could not load product details. Please try again later.");
        // Don't set any mock data, leave values as null or empty
        setProduct(null);
        setShop(null);
        setRelatedProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      fetchProductData();
    }
  }, [productId]);

  // Calculate final price based on discount and selected variant
  const calculateFinalPrice = () => {
    if (!product) return 0;

    let basePrice = product.basePrice;

    // Apply variant price adjustment if a variant is selected
    if (selectedVariant && selectedVariant.priceAdjustment) {
      basePrice += selectedVariant.priceAdjustment;
    }

    // Apply discount if available
    if (product.discountPercentage) {
      return basePrice - basePrice * (product.discountPercentage / 100);
    }

    return basePrice;
  };

  // Handle quantity change
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    const maxQty = selectedVariant
      ? selectedVariant.availableQuantity
      : product?.availableQuantity || 10;

    if (quantity < maxQty) {
      setQuantity(quantity + 1);
    } else {
      toast.error(`Sorry, only ${maxQty} items available`);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;

    const finalPrice = calculateFinalPrice();

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: finalPrice,
      quantity: quantity,
      image:
        product.images && product.images.length > 0
          ? product.images[0].url
          : null,
      shopId: product.shopId,
      shopName: product.shopName,
      variant: selectedVariant ? selectedVariant.name : null,
      variantId: selectedVariant ? selectedVariant._id : null,
    };

    addToCart(cartItem);
    toast.success("Added to cart!");
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Product Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The product you're looking for doesn't exist or has been removed.
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

  const finalPrice = calculateFinalPrice();

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
          {product.category && (
            <>
              <Link
                href={`/category/${product.category.toLowerCase()}`}
                className="hover:text-emerald-600"
              >
                {product.category}
              </Link>
              <ChevronRight size={16} className="mx-1" />
            </>
          )}
          <span className="text-gray-700">{product.name}</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            {/* Product Images */}
            <div className="md:w-1/2 p-6">
              <div
                className="relative mb-4 rounded-lg overflow-hidden"
                style={{ height: "400px" }}
              >
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[selectedImage].url}
                    alt={product.name}
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <ShoppingCart className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                {/* Discount badge */}
                {product.discountPercentage > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                    {product.discountPercentage}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnail images */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-16 h-16 rounded-md overflow-hidden ${
                        selectedImage === index
                          ? "ring-2 ring-emerald-500"
                          : "ring-1 ring-gray-200"
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="md:w-1/2 p-6 border-t md:border-t-0 md:border-l border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {/* Shop info if available */}
              {(product.shopName || shop) && (
                <div className="flex items-center mb-3">
                  <Link
                    href={`/shops/${product.shopId || (shop && shop._id)}`}
                    className="flex items-center text-sm text-gray-600 hover:text-emerald-600"
                  >
                    <Store size={16} className="mr-1" />
                    <span>{product.shopName || (shop && shop.name)}</span>

                    {shop && shop.isVerified && (
                      <span className="ml-1 text-emerald-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Ratings */}
              <div className="flex items-center mb-4">
                <div className="flex mr-1">
                  {generateStars(product.avgRating || 0)}
                </div>
                <span className="text-sm text-gray-500">
                  ({product.reviewCount || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-emerald-600">
                    ₹{finalPrice.toFixed(2)}
                  </span>
                  {product.discountPercentage > 0 && (
                    <span className="ml-2 text-gray-500 line-through">
                      ₹{product.basePrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {product.discountPercentage > 0 && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    You save: ₹{(product.basePrice - finalPrice).toFixed(2)} (
                    {product.discountPercentage}%)
                  </div>
                )}
              </div>

              {/* Short description */}
              {product.shortDescription && (
                <div className="mb-6">
                  <p className="text-gray-600">{product.shortDescription}</p>
                </div>
              )}

              {/* Variants selection if available */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Options
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-3 py-1 border rounded-md text-sm ${
                          selectedVariant && selectedVariant._id === variant._id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {variant.name}
                        {variant.priceAdjustment > 0 &&
                          ` (+₹${variant.priceAdjustment.toFixed(2)})`}
                        {variant.priceAdjustment < 0 &&
                          ` (-₹${Math.abs(variant.priceAdjustment).toFixed(
                            2
                          )})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Quantity
                </h3>
                <div className="flex items-center">
                  <button
                    onClick={decreaseQuantity}
                    className="p-2 border border-gray-300 rounded-l-md hover:bg-gray-100"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="w-12 border-t border-b border-gray-300 py-2 text-center">
                    {quantity}
                  </div>
                  <button
                    onClick={increaseQuantity}
                    className="p-2 border border-gray-300 rounded-r-md hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>

                  <div className="ml-4 text-sm text-gray-500">
                    {selectedVariant
                      ? `${selectedVariant.availableQuantity} available`
                      : product.availableQuantity
                      ? `${product.availableQuantity} available`
                      : ""}
                  </div>
                </div>
              </div>

              {/* Add to cart button */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  className="flex-grow py-3 px-4 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200 flex items-center justify-center"
                >
                  <ShoppingCart size={18} className="mr-2" />
                  Add to Cart
                </button>

                <button
                  className="p-3 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition duration-200"
                  aria-label="Add to wishlist"
                  onClick={() => toast.success("Added to wishlist!")}
                >
                  <Heart size={18} />
                </button>

                <button
                  className="p-3 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition duration-200"
                  aria-label="Share product"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.name,
                        text: `Check out ${product.name} on LocalLens!`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }
                  }}
                >
                  <Share size={18} />
                </button>
              </div>

              {/* Delivery and return policies */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Truck className="h-5 w-5 text-emerald-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Fast Local Delivery
                      </h4>
                      <p className="text-xs text-gray-500">
                        Usually within 24-48 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-emerald-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Same-day Pickup Available
                      </h4>
                      <p className="text-xs text-gray-500">
                        Order before 2pm for same-day pickup
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Satisfaction Guaranteed
                      </h4>
                      <p className="text-xs text-gray-500">
                        7-day return policy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("description")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "description"
                    ? "border-b-2 border-emerald-500 text-emerald-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Description
              </button>

              <button
                onClick={() => setActiveTab("specifications")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "specifications"
                    ? "border-b-2 border-emerald-500 text-emerald-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Specifications
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

          <div className="p-6">
            {/* Description Tab */}
            {activeTab === "description" && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Product Description
                </h2>
                <div className="prose max-w-none text-gray-600">
                  {product.description ? (
                    <p>{product.description}</p>
                  ) : (
                    <p>No description available for this product.</p>
                  )}
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === "specifications" && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Technical Specifications
                </h2>

                {product.specifications ? (
                  <div className="bg-gray-50 rounded-md">
                    <dl className="divide-y divide-gray-200">
                      {Object.entries(product.specifications).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="px-4 py-3 grid grid-cols-3 gap-4"
                          >
                            <dt className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {value}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No specifications available for this product.
                  </p>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    Customer Reviews
                  </h2>

                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {generateStars(product.avgRating || 0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {product.avgRating ? product.avgRating.toFixed(1) : "0.0"}{" "}
                      out of 5
                    </span>
                  </div>
                </div>

                {/* Reviews will be fetched and displayed here */}
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No reviews yet. Be the first to review this product.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="container mx-auto px-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct._id} className="flex">
                <Link
                  href={`/products/${relatedProduct._id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-transform hover:scale-[1.02] flex-grow"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {relatedProduct.images &&
                    relatedProduct.images.length > 0 ? (
                      <Image
                        src={relatedProduct.images[0].url}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <ShoppingCart className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Discount badge */}
                    {relatedProduct.discountPercentage > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {relatedProduct.discountPercentage}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-gray-900 font-medium mb-1 line-clamp-1">
                      {relatedProduct.name}
                    </h3>

                    <div className="flex items-baseline mb-2">
                      <span className="text-emerald-600 font-semibold">
                        ₹
                        {relatedProduct.discountPercentage
                          ? (
                              relatedProduct.basePrice -
                              relatedProduct.basePrice *
                                (relatedProduct.discountPercentage / 100)
                            ).toFixed(2)
                          : relatedProduct.basePrice.toFixed(2)}
                      </span>
                      {relatedProduct.discountPercentage > 0 && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ₹{relatedProduct.basePrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex mr-1">
                          {generateStars(relatedProduct.avgRating || 0)}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({relatedProduct.reviewCount || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
