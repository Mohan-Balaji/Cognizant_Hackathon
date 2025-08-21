'use client';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import React, { useState } from 'react';

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/sign-in');
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/sign-in');
    setMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm fixed w-full z-20 top-0 left-0">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 md:px-8">
        {/* Logo and Title */}
        <a href="/" className="flex items-center gap-3">
          <img src="/images/logo.jpg" className="h-10 w-10 object-contain rounded-full border border-gray-200" alt="Logo" />
          <span className="text-xl font-semibold font-MyFont tracking-tight text-gray-800">Hospital Readmissions</span>
        </a>
        {/* Hamburger */}
        <button
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          aria-controls="navbar-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="sr-only">Open main menu</span>
          <svg className="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
        {/* Menu */}
        <div
          className={`${
            menuOpen ? 'block' : 'hidden'
          } absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent shadow-md md:shadow-none border-b md:border-0 transition-all duration-300 md:flex md:items-center z-10`}
          id="navbar-menu"
        >
          <ul className="flex flex-col md:flex-row gap-2 md:gap-3 items-center md:bg-transparent p-4 md:p-0">
            {/* Home and About always visible */}
            <li>
              <a
                href="/"
                className="px-4 py-2 rounded-full text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/#about"
                className="px-4 py-2 rounded-full text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                About
              </a>
            </li>
            {/* Authenticated user extra menu */}
            {!loading && user ? (
              <>
                <li>
                  <a href="#" className="px-4 py-2 rounded-full text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200" onClick={() => setMenuOpen(false)}>Services</a>
                </li>
                <li>
                  <a href="#" className="px-4 py-2 rounded-full text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200" onClick={() => setMenuOpen(false)}>Pricing</a>
                </li>
                <li>
                  <a href="#" className="px-4 py-2 rounded-full text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200" onClick={() => setMenuOpen(false)}>Contact</a>
                </li>
                <li className="md:hidden w-full flex justify-center mt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : null}
            {/* Unauthenticated user menu (mobile) */}
            {!loading && !user ? (
              <>
                <li className="md:hidden w-full flex justify-center mt-2">
                  <button
                    onClick={handleSignIn}
                    className="w-full px-4 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200 mb-2"
                  >
                    Sign In
                  </button>
                </li>
                <li className="md:hidden w-full flex justify-center">
                  <button
                    onClick={() => { router.push('/sign-up'); setMenuOpen(false); }}
                    className="w-full px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200"
                  >
                    Sign Up
                  </button>
                </li>
              </>
            ) : null}
          </ul>
        </div>
        {/* Desktop Sign In/Logout */}
  <div className="hidden md:block ml-8">
          {/* Desktop: show Logout if logged in, else Sign In and Sign Up */}
          {!loading && user ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200 mr-2"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/sign-up')}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;