"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";

export default function LandingPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      router.replace("/"); // Redirect authenticated users to main app
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">Welcome to Hospital Readmissions</h1>
      <p className="text-lg text-gray-600 mb-8">Empowering healthcare with AI-driven insights.</p>
      <div className="flex gap-4 mb-8">
        <a href="#home" className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200">Home</a>
        <a href="#about" className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200">About</a>
      </div>
      <section id="home" className="w-full max-w-2xl mb-8 p-6 bg-gray-50 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2 text-gray-700">Home</h2>
        <p className="text-gray-600">Discover how our platform helps reduce hospital readmissions and improve patient outcomes using advanced analytics and machine learning.</p>
      </section>
      <section id="about" className="w-full max-w-2xl p-6 bg-gray-50 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2 text-gray-700">About</h2>
        <p className="text-gray-600">Our mission is to support healthcare professionals with actionable insights, making healthcare more efficient and patient-centric.</p>
      </section>
    </main>
  );
}
