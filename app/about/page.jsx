"use client";

import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              About LocalLens
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Connecting you with local retailers in your neighborhood
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            At LocalLens, our mission is to bridge the gap between local
            businesses and consumers in their community. We believe in
            empowering neighborhood retailers while providing shoppers with
            convenient access to products available right around the corner.
          </p>
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            We're passionate about supporting local economies and helping small
            businesses thrive in an increasingly digital world. By connecting
            retailers with nearby customers, we create a sustainable ecosystem
            that benefits everyone involved.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10 text-center">
            What Makes Us Different
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Hyper-Local Focus
              </h3>
              <p className="text-gray-600">
                We connect you exclusively with retailers in your immediate
                vicinity, ensuring you discover what's available close to home.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Seamless Shopping
              </h3>
              <p className="text-gray-600">
                Our platform makes it easy to browse local inventory, make
                reservations, and pick up purchases at your convenience.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Retailer Growth Tools
              </h3>
              <p className="text-gray-600">
                We provide local businesses with powerful digital tools to
                expand their reach and grow their customer base effectively.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team/Company Section */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            Our Story
          </h2>
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            LocalLens was founded in 2023 by a team of retail enthusiasts and
            tech innovators who recognized a growing disconnect between local
            shops and their communities. As online shopping giants continued to
            dominate the market, we saw an opportunity to revitalize local
            retail through technology.
          </p>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            What began as a simple idea has evolved into a comprehensive
            platform that serves thousands of retailers and customers across
            multiple regions. We're constantly improving our services based on
            feedback from our community of users and retailers.
          </p>

          <div className="text-center">
            <Link
              href="/contact"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
            >
              Get in Touch With Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
