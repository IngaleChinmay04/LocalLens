"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";

export default function Navbar() {
  const { user, mongoUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-white border-gray-200 shadow-sm">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-8 w-8 relative">
            <Image
              src="/logo.svg"
              alt="LocalLens Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="self-center text-2xl font-semibold whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-500 text-transparent bg-clip-text">
            LocalLens
          </span>
        </Link>

        {/* User menu */}
        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          {user ? (
            <>
              <button
                type="button"
                className="flex text-sm rounded-full md:me-0 focus:ring-4 focus:ring-gray-300"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="sr-only">Open user menu</span>
                {user.photoURL ? (
                  <Image
                    className="w-8 h-8 rounded-full"
                    src={user.photoURL}
                    alt="user photo"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute top-12 right-4 z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow">
                  <div className="px-4 py-3">
                    <span className="block text-sm text-gray-900">
                      {user.displayName}
                    </span>
                    <span className="block text-sm text-gray-500 truncate">
                      {user.email}
                    </span>
                    {mongoUser && (
                      <span className="block text-xs text-emerald-600 mt-1">
                        {mongoUser.role.charAt(0).toUpperCase() +
                          mongoUser.role.slice(1)}
                      </span>
                    )}
                  </div>
                  <ul className="py-2" aria-labelledby="user-menu-button">
                    <li>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                    </li>

                    {mongoUser?.role === "admin" && (
                      <li>
                        <Link
                          href="/admin/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Users
                        </Link>
                      </li>
                    )}

                    {mongoUser?.role === "retailer" && (
                      <li>
                        <Link
                          href="/retailer/products"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Products
                        </Link>
                      </li>
                    )}

                    <li>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/signin"
              className="text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-emerald-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Sign In
            </Link>
          )}

          <button
            data-collapse-toggle="navbar-user"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-controls="navbar-user"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <div
          className={`items-center justify-between ${
            isMenuOpen ? "block" : "hidden"
          } w-full md:flex md:w-auto md:order-1`}
          id="navbar-user"
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white">
            <li>
              <Link
                href="/"
                className="block py-2 px-3 text-white bg-gradient-to-r from-emerald-600 to-teal-500 rounded md:bg-transparent md:from-transparent md:to-transparent md:text-emerald-600 md:p-0"
                aria-current="page"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/shops"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-emerald-600 md:p-0"
                onClick={() => setIsMenuOpen(false)}
              >
                Shops
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-emerald-600 md:p-0"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
            </li>
            {mongoUser?.role === "admin" && (
              <li>
                <Link
                  href="/admin"
                  className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-emerald-600 md:p-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              </li>
            )}
            {mongoUser?.role === "retailer" && (
              <li>
                <Link
                  href="/retailer"
                  className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-emerald-600 md:p-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Retailer Portal
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/about"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-emerald-600 md:p-0"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-emerald-600 md:p-0"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
