import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import ToastProvider from "./components/ToastProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "HealthBridge AI - Your Health Companion",
  description: "AI-powered health management platform for better healthcare outcomes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <ErrorBoundary>
          <ToastProvider/>
          <Navbar/>
          <main className="min-h-[80vh] bg-white px-2 md:px-0">
            {children}
          </main>
          <Footer/>
        </ErrorBoundary>
      </body>
    </html>
  );
}
