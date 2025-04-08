"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function RoleProtected({ children, allowedRoles }) {
  const { user, mongoUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/signin");
      } else if (
        mongoUser &&
        allowedRoles &&
        !allowedRoles.includes(mongoUser.role)
      ) {
        router.push("/dashboard");
      }
    }
  }, [user, mongoUser, loading, router, allowedRoles]);

  // Show loading state while checking authentication and authorization
  if (loading || !user || !mongoUser) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  // Check if user is authorized
  if (!allowedRoles.includes(mongoUser.role)) {
    return null; // This will be replaced by router.push in useEffect
  }

  // User is authorized, render content
  return children;
}
