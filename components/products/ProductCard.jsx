"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  if (!product) return null;

  // Calculate discounted price
  const finalPrice = product.discountPercentage
    ? product.basePrice - product.basePrice * (product.discountPercentage / 100)
    : product.basePrice;

  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.src = "/assets/product-placeholder.jpg";
    e.target.onerror = null; // Prevent infinite error loop
  };

  // Add to cart function
  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation();

    const productToAdd = {
      id: product._id,
      productId: product._id,
      name: product.name,
      shopName: product.shopName,
      price: finalPrice,
      image:
        product.images && product.images.length > 0
          ? product.images[0].url
          : null,
      availableQuantity: product.availableQuantity || 99,
      quantity: 1,
      shopId: product.shopId,
    };

    addToCart(productToAdd);
    // The notification is now handled by CartContext and displayed in CartDrawer
  };

  // Navigate to shop page
  const navigateToShop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shopId =
      typeof product.shopId === "object" ? product.shopId._id : product.shopId;
    router.push(`/shops/${shopId}`);
  };

  // Navigate to product page
  const navigateToProduct = () => {
    router.push(`/products/${product._id}`);
  };

  // Generate stars based on rating
  const generateStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} fill="#FFD700" stroke="#FFD700" size={12} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="text-gray-300" size={12} />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star fill="#FFD700" stroke="#FFD700" size={12} />
          </div>
        </div>
      );
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="text-gray-300" size={12} />
      );
    }

    return stars;
  };

  return (
    <div
      className="block bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
      onClick={navigateToProduct}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            className="object-cover"
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Discount badge */}
        {product.discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discountPercentage}% OFF
          </div>
        )}

        {/* Special badges */}
        {product.isPreBookable && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
            Pre-book
          </div>
        )}

        {/* Quick action buttons */}
        <div
          className={`absolute bottom-0 left-0 right-0 flex justify-between items-center p-2 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={handleAddToCart}
            className="p-1.5 bg-white rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingCart size={16} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // You could implement wishlist functionality similar to cart
            }}
            className="p-1.5 bg-white rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-gray-900 font-medium mb-1 line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-baseline mb-2">
          <span className="text-emerald-600 font-semibold">
            ₹{finalPrice.toFixed(2)}
          </span>
          {product.discountPercentage > 0 && (
            <span className="ml-2 text-sm text-gray-500 line-through">
              ₹{product.basePrice.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex mr-1">
              {generateStars(product.avgRating || 0)}
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviewCount || 0})
            </span>
          </div>

          {product.shopName && (
            <button
              onClick={navigateToShop}
              className="text-xs text-gray-500 hover:text-emerald-600"
            >
              {product.shopName}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
