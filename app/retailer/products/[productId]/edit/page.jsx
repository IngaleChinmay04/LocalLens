"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RetailerLayout from "@/components/layouts/RetailerLayout";
import ProductForm from "@/components/retailers/ProductForm";
import { toast } from "react-hot-toast";

export default function EditProductPage({ params }) {
  // Use React.use to unwrap the params promise for Next.js 14+
  const unwrappedParams = React.use(params);
  const { productId } = unwrappedParams;

  const { user, mongoUser, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (mongoUser && mongoUser.role !== "retailer"))) {
      router.push("/");
    }
  }, [user, mongoUser, loading, router]);

  useEffect(() => {
    if (productId && mongoUser && mongoUser.role === "retailer") {
      fetchProduct();
    }
  }, [productId, mongoUser]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);

      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();
      setProduct(data);
    } catch (error) {
      toast.error("Error loading product");
      console.error("Error loading product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || (productId && isLoading)) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (mongoUser?.role !== "retailer") {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="mb-6">You do not have permission to access this page.</p>
        <Link
          href="/"
          className="text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <RetailerLayout>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h1 className="text-xl font-medium text-red-600 mb-4">
            Product Not Found
          </h1>
          <p className="mb-6">
            The product you are trying to edit does not exist or you don't have
            permission to edit it.
          </p>
          <Link
            href="/retailer/products"
            className="text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
          >
            Back to Products
          </Link>
        </div>
      </RetailerLayout>
    );
  }

  return (
    <RetailerLayout>
      <ProductForm product={product} shopId={product.shopId} isEditing={true} />
    </RetailerLayout>
  );
}
