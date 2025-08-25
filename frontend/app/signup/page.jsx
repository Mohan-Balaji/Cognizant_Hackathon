'use client'
import { useState, useEffect } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { toast } from 'sonner';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth);
  const [localLoading, setLocalLoading] = useState(false);
  const router = useRouter();

  // Show toast on hook error and stop local loading
  useEffect(() => {
    if (!error) return;
    if (error.code === 'auth/email-already-in-use') {
      toast.error('Email already in use', { description: 'Please sign in instead.' });
    } else if (error.code === 'auth/weak-password') {
      toast.error('Password too weak', { description: 'Please use a stronger password.' });
    } else if (error.code === 'auth/invalid-email') {
      toast.error('Invalid email', { description: 'Please enter a valid email address.' });
    }
    setLocalLoading(false);
  }, [error]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match', { description: 'Please make sure both passwords are identical.' });
      return;
    }

    if (password.length < 6) {
      toast.error('Password too short', { description: 'Password must be at least 6 characters long.' });
      return;
    }

    setLocalLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(email, password);
      if (res) {
        sessionStorage.setItem('user', JSON.stringify(res.user.uid));
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        toast.success('Account created successfully!', { description: 'Welcome to Hospital Readmissions!' });
        router.push('/');
      }
    } catch (err) {
      if (err && err.code === 'auth/email-already-in-use') {
        toast.error('Email already in use', { description: 'Please sign in instead.' });
      } else if (err && err.code === 'auth/weak-password') {
        toast.error('Password too weak', { description: 'Please use a stronger password.' });
      } else if (err && err.code === 'auth/invalid-email') {
        toast.error('Invalid email', { description: 'Please enter a valid email address.' });
      } else {
        toast.error('Sign up failed', { description: 'Please try again.' });
      }
      console.error(err);
    } finally {
      if (!error) setLocalLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-20 w-20 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img src="/images/logo.jpg" alt="Logo" className="h-14 w-14 object-contain rounded-full" />
            </div>
            <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
              🏥 Create Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join Hospital Readmissions for AI-powered insights
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-4">
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
                  className="w-full p-3 rounded-lg outline-none bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg outline-none bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Create a password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-lg outline-none bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Error & Loading */}
            {error && error.code === 'auth/email-already-in-use' && (
              <p className="text-red-500 text-sm mt-2">Email already in use. Please sign in instead.</p>
            )}
            {error && error.code === 'auth/weak-password' && (
              <p className="text-red-500 text-sm mt-2">Password too weak. Please use a stronger password.</p>
            )}
            {error && error.code === 'auth/invalid-email' && (
              <p className="text-red-500 text-sm mt-2">Invalid email. Please enter a valid email address.</p>
            )}
            {error && !['auth/email-already-in-use', 'auth/weak-password', 'auth/invalid-email'].includes(error.code) && (
              <p className="text-red-500 text-sm mt-2">Sign up failed. Please try again.</p>
            )}
            {(loading || localLoading) && !error && (
              <p className="text-gray-500 text-sm mt-2">Creating account...</p>
            )}

            <div>
              <button
                type="submit"
                disabled={(loading || localLoading) && !error}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {(loading || localLoading) && !error ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-blue-600 hover:text-blue-500 font-medium">
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

export default SignUp;
