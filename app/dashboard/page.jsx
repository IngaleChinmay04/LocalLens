"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import CustomerDashboard from "@/components/dashboard/CustomerDashboard";
import RetailerDashboard from "@/components/dashboard/RetailerDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const { user, mongoUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !mongoUser) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  // Display appropriate dashboard based on user role
  return (
    <>
      {mongoUser.role === "admin" && <AdminDashboard />}
      {mongoUser.role === "retailer" && <RetailerDashboard />}
      {mongoUser.role === "customer" && <CustomerDashboard />}
    </>
  );
}
