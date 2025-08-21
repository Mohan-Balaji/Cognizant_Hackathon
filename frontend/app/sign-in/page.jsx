'use client'
import { useState } from 'react';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const res = await signInWithEmailAndPassword(email, password);
      if (res) {
        sessionStorage.setItem('user', JSON.stringify(res.user.uid)); // store uid instead of just true
        setEmail('');
        setPassword('');
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img src="/images/logo.jpg" alt="Logo" className="h-12 w-12 object-contain rounded-full" />
            </div>
            <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
              Hospital Readmissions Sign In
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to continue
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
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
                  className="w-full p-3 rounded-lg outline-none bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300"
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg outline-none bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Error & Loading */}
            {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
            {loading && <p className="text-gray-500 text-sm mt-2">Signing in...</p>}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don’t have an account?{' '}
                <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SignIn;
  