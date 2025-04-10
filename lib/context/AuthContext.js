"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Create context
const AuthContext = createContext({});

// Export the provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user data from MongoDB
        try {
          const response = await fetch(
            `/api/users/email/${firebaseUser.email}`
          );
          if (response.ok) {
            const userData = await response.json();
            setMongoUser(userData);
          }
        } catch (error) {
          console.error("Error fetching MongoDB user:", error);
        }
      } else {
        setUser(null);
        setMongoUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getIdToken = async () => {
    if (user) {
      try {
        return await user.getIdToken();
      } catch (error) {
        console.error("Error getting ID token:", error);
        throw error;
      }
    }
    return null;
  };

  // Sign in with Google
  const googleSignIn = async (role = "customer") => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user exists in MongoDB, if not create one
      const response = await fetch(`/api/users/email/${result.user.email}`);

      if (!response.ok) {
        // User doesn't exist in MongoDB, create one
        const createResponse = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL || "",
            phoneNumber: result.user.phoneNumber || "",
            role: role, // Use the role parameter from sign-in
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create user in MongoDB");
        }
      } else {
        // User exists, update last login
        await fetch(`/api/users/email/${result.user.email}/login`, {
          method: "PUT",
        });
      }

      return result.user;
    } catch (error) {
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Context value
  const value = {
    user,
    mongoUser,
    googleSignIn,
    logout,
    loading,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
