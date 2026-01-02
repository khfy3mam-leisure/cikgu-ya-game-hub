'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ExistingUserSelector from '@/components/ExistingUserSelector';
import NewUserForm from '@/components/NewUserForm';

type Mode = 'select' | 'new' | 'existing';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('select');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/games';

  const handleUserSelected = (userId: string) => {
    // Store user ID in session/localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', userId);
    }
    router.push(redirect);
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome to Cikgu Ya Game Hub!
            </h1>
            <p className="text-gray-600">
              Choose how you'd like to continue
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('new')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg"
            >
              ✨ New User
            </button>
            <button
              onClick={() => setMode('existing')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg"
            >
              👤 Existing User
            </button>
          </div>

          <Link 
            href="/games"
            className="block text-center mt-6 text-gray-500 hover:text-gray-700 text-sm"
          >
            Continue as guest →
          </Link>
        </div>
      </div>
    );
  }

  if (mode === 'new') {
    return (
      <NewUserForm 
        onSuccess={handleUserSelected}
        onBack={() => setMode('select')}
      />
    );
  }

  return (
    <ExistingUserSelector 
      onSelect={handleUserSelected}
      onBack={() => setMode('select')}
    />
  );
}

