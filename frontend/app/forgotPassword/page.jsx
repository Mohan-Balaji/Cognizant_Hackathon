'use client'
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast.success('Password reset email sent!', { 
        description: 'Check your email for reset instructions.' 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('Email not found', { 
          description: 'No account exists with this email address.' 
        });
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email', { 
          description: 'Please enter a valid email address.' 
        });
      } else {
        toast.error('Failed to send reset email', { 
          description: 'Please try again later.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <ProtectedRoute requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
                Check Your Email
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="mt-4 text-center text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setEmailSent(false)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Try Another Email
              </button>
              <Link
                href="/sign-in"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img src="/images/logo.jpg" alt="Logo" className="h-12 w-12 object-contain rounded-full" />
            </div>
            <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg outline-none bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/sign-in" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ForgotPassword;