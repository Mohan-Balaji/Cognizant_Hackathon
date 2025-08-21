

'use client'
import { useState } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import Image from 'next/image';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createUserWithEmailAndPassword, , error, loading] = useCreateUserWithEmailAndPassword(auth);

  const handleSignUp = async () => {
    try {
      const res = await createUserWithEmailAndPassword(email, password);
      console.log({ res });
      sessionStorage.setItem('user', true);
      setEmail('');
      setPassword('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white">
        <div className="flex justify-center items-center mb-6">
          <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Image src="/images/logo.jpg" alt="Logo" width={48} height={48} className="rounded-full object-contain" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-900">Sign Up</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg outline-none bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg outline-none bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300"
        />
        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-100 border border-red-300 rounded-lg px-3 py-2">{error.message}</div>
        )}
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full p-3 rounded-lg font-semibold shadow-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
        <div className="mt-4 text-center">
          <span className="text-gray-600 text-sm">
            Already have an account?{' '}
            <a href="/sign-in" className="font-medium text-blue-500 hover:underline">Sign in</a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignUp;