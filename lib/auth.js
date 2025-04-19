// Firebase authentication utilities
import { auth } from "./firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";

// Firebase provider for Google authentication
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google using Firebase
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid) => {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

/**
 * Firebase auth state observer
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} - Unsubscribe function
 */
export const onAuthStateChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};
