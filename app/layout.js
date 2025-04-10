import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import { AuthProvider } from "@/lib/context/AuthContext";
import ClientProviders from "@/components/ClientProviders";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LocalLens - Your Local Shopping Companion",
  description: "Discover and connect with local retailers near you",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen bg-gray-50">{children}</main>
            <footer className="bg-gray-800 text-white py-6">
              <div className="container mx-auto px-4 text-center">
                <p>© 2025 LocalLens. All rights reserved.</p>
              </div>
            </footer>
          </AuthProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
