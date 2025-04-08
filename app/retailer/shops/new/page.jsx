"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import RetailerLayout from "@/components/layouts/RetailerLayout";
import ShopRegistrationForm from "@/components/retailers/ShopRegistrationForm";

export default function NewShopPage() {
  const { user, mongoUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (mongoUser && mongoUser.role !== "retailer"))) {
      router.push("/");
    }
  }, [user, mongoUser, loading, router]);

  if (loading || !mongoUser) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (mongoUser.role !== "retailer") {
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

  return (
    <RetailerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Register a New Shop</h1>
        <p className="text-gray-600">
          Fill in the details to set up your shop on LocalLens
        </p>
      </div>
      <ShopRegistrationForm />
    </RetailerLayout>
  );
}
