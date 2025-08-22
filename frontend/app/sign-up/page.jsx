'use client'
import { useState, useEffect } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth);
  const [localLoading, setLocalLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [emailError, setEmailError] = useState('');

  // Show toast when the Firebase hook reports an error
  useEffect(() => {
    if (!error) return;
    
    // Check for various Firebase error codes and messages
    const isEmailExists =
      error?.code === 'auth/email-already-in-use' ||
      error?.code === 'auth/email-already-exists' ||
      error?.message === 'EMAIL_EXISTS' ||
      error?.message?.includes('EMAIL_EXISTS') ||
      error?.message?.includes('already exists') ||
      error?.message?.includes('already in use');

    if (isEmailExists) {
      toast.error('User already exists', {
        description: 'Please sign in instead with your existing account.',
      });
    } else {
      toast.error('Sign up failed', {
        description: error?.message || 'Please try again later.',
      });
    }
    setIsLoading(false);
    setLocalLoading(false);
  }, [error]);

  const validateEmail = (email) => {
    // Simple email regex for validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignUp = async () => {
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setLocalLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(email, password);
      if (res) {
        sessionStorage.setItem('user', JSON.stringify(res.user.uid));
        setEmail('');
        setPassword('');
        setIsLoading(false);
        setLocalLoading(false);
        router.push('/');
        return;
      }
    } catch (e) {
      const emailExists =
        e?.code === 'auth/email-already-in-use' ||
        e?.message === 'EMAIL_EXISTS' ||
        e?.error?.message === 'EMAIL_EXISTS' ||
        e?.error?.errors?.[0]?.message === 'EMAIL_EXISTS';

      if (emailExists) {
        toast.error('User already exists', {
          description: 'Please sign in instead with your existing account.',
        });
      } else {
        toast.error('Sign up failed', {
          description: e?.message || 'Please try again later.',
        });
      }
      setIsLoading(false);
      setLocalLoading(false);
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8 px-2">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Image src="/images/logo.jpg" alt="Logo" width={48} height={48} className="rounded-full object-contain" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 text-center">Sign Up</h1>
          <p className="mt-1 text-center text-sm text-gray-600">Create your account</p>
        </div>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSignUp(); }}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg outline-none bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300"
            />
            {emailError && (
              <div className="mt-2 text-sm text-red-500 bg-red-100 border border-red-300 rounded-lg px-3 py-2">{emailError}</div>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg outline-none bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300"
            />
          </div>

          <button
            type="submit"
            onClick={handleSignUp}
            disabled={isLoading}
            className="w-full p-3 rounded-lg font-semibold shadow-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
          <div className="mt-4 text-center">
            <span className="text-gray-600 text-sm">
              Already have an account?{' '}
              <a href="/sign-in" className="font-medium text-blue-500 hover:underline">Sign in</a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;