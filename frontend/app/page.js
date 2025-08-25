'use client';
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/firebase/config';

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [status, setStatus] = useState('checking...');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${API_URL}/health`).then(r => r.json()).then(d => setStatus(d.status || 'ok')).catch(() => setStatus('down'));
  }, [API_URL]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;

  // Only show landing page for non-authenticated users
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Welcome to Hospital Readmissions</h1>
        <p className="text-lg text-gray-600 mb-8">Empowering healthcare with AI-driven insights.</p>
        <section id="home" className="w-full max-w-2xl mb-8 p-6 bg-gray-50 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-2 text-gray-700">Home</h2>
          <p className="text-gray-600">Sign in to run predictions on patient data.</p>
        </section>
      </main>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}