import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/NavBar";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900`}
      >
        <ErrorBoundary>
          <Navbar/>
          <main className="min-h-screen">
            
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
