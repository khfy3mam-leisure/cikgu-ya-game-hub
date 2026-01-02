'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinGamePage() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    // Check if user is logged in
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    if (!userId) {
      // Redirect to login with the code as a parameter
      router.push(`/login?redirect=/join/${inviteCode.toUpperCase()}`);
      return;
    }

    // Redirect to join page with code
    router.push(`/join/${inviteCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <Link href="/games" className="text-gray-500 hover:text-gray-700 text-sm mb-4 inline-block">
          ← Back to Games
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Join a Game
          </h1>
          <p className="text-gray-600">
            Enter the invite code from the Game Master
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-mono font-bold tracking-widest text-black"
              placeholder="ABC123"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Ask the Game Master for the invite code
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg"
          >
            Join Game 🎮
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/games"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Want to create a game instead?
          </Link>
        </div>
      </div>
    </div>
  );
}

