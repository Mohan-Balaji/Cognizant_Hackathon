'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';   
import ProtectedRoute from './ProtectedRoute';  
import LoadingSpinner from './LoadingSpinner';
import React, { useState } from 'react';
import Image from 'next/image';
const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-8 py-4">
        <a href="" className="flex items-center gap-3">
          <img src="/images/logo.jpg" className="h-10 w-10 object-contain" alt="Logo" />
          <span className="text-xl font-semibold font-MyFont tracking-tight text-gray-800">Hospital Readmissions</span>
        </a>
        <button
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          aria-controls="navbar-default"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="sr-only">Open main menu</span>
          <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div className={`${menuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`} id="navbar-default">
          <ul className="flex flex-col md:flex-row gap-2 md:gap-3 items-center bg-white md:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none shadow-none border md:border-0 mt-4 md:mt-0">
            <li>
              <a href="#" className="px-4 py-2 rounded-full text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Home</a>
            </li>
            <li>
              <a href="#" className="px-4 py-2 rounded-full text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 font-MyFont">About</a>
            </li>
            <li>
              <a href="#" className="px-4 py-2 rounded-full text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Services</a>
            </li>
            <li>
              <a href="#" className="px-4 py-2 rounded-full text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Pricing</a>
            </li>
            <li>
              <a href="#" className="px-4 py-2 rounded-full text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Contact</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;