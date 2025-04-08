import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        await dbConnect();

        // Check if user exists in our DB
        const existingUser = await User.findOne({ email: user.email });

        if (existingUser) {
          // Update last login
          await User.findByIdAndUpdate(existingUser._id, {
            lastLogin: new Date(),
          });
        } else {
          // Create a new user
          const newUser = await User.create({
            email: user.email,
            displayName: user.name,
            photoURL: user.image,
            role: "customer", // Default role
            firebaseUid: "", // We're not using Firebase in this implementation
          });

          user.id = newUser._id.toString();
          user.role = newUser.role;
        }

        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        // Fetch user from DB to get role and other details
        await dbConnect();
        const dbUser = await User.findOne({
          email: user.email,
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser._id.toString();
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};
