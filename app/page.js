"use client";

import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import CustomerDashboard from "@/components/dashboard/CustomerDashboard";

export default function HomePage() {
  const { user, mongoUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip redirection if authentication is still loading
    if (isLoading) return;

    // If user is authenticated, redirect based on role
    if (user && mongoUser) {
      const role = mongoUser.role;

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "retailer") {
        router.push("/retailer");
      }
      // Customers stay on this page
    }
  }, [user, mongoUser, isLoading, router]);

  // Show loading state while authentication is in progress
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is an admin or retailer, the useEffect will redirect them
  // If user is a customer or not logged in, show the customer dashboard
  return <CustomerDashboard />;
}
