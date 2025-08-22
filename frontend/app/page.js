'use client';
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const [status, setStatus] = useState('checking...');
  const [result, setResult] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${API_URL}/health`).then(r => r.json()).then(d => setStatus(d.status || 'ok')).catch(() => setStatus('down'));
  }, [API_URL]);

  const predict = async () => {
    setIsCalling(true);
    setResult(null);
    try {
      const payload = {
    'age':'[70-80)', 'time_in_hospital':5, 'n_lab_procedures':40, 'n_procedures':1, 'n_medications':20,
    'n_outpatient':0,'n_inpatient':0,'n_emergency':0,'medical_specialty':'InternalMedicine',
    'diag_1':'Circulatory','diag_2':'Other','diag_3':'Other','glucose_test':'normal','A1Ctest':'high',
    'change':'Ch','diabetes_med':'Yes'
}
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ status: 'error', message: e.message });
    } finally {
      setIsCalling(false);
    }
  };

  if (loading) return null;

  // Guest landing page
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

  // Authenticated home with quick predict
  return (
    <main className="min-h-screen flex flex-col gap-6 items-center pt-8 bg-white">
      <div className="text-sm text-gray-600">Backend status: <span className={status === 'ok' ? 'text-green-600' : 'text-red-600'}>{status}</span></div>
      <h1 className="text-2xl font-semibold text-gray-800">Hospital Readmission Predictor</h1>
      <button
        onClick={predict}
        disabled={isCalling}
        className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isCalling ? 'Predicting…' : 'Predict (Example Patient)'}
      </button>
      {result && (
        <pre className="w-full max-w-2xl bg-gray-50 rounded p-4 shadow text-sm">{JSON.stringify(result, null, 2)}</pre>
      )}
    </main>
  );
}