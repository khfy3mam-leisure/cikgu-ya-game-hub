'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function CreateGamePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGame = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    if (!userId) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let inviteCode = generateInviteCode();
      let codeExists = true;

      // Ensure unique invite code
      while (codeExists) {
        const { data } = await supabase
          .from('games')
          .select('id')
          .eq('invite_code', inviteCode)
          .single();

        if (!data) {
          codeExists = false;
        } else {
          inviteCode = generateInviteCode();
        }
      }

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          game_master_id: userId,
          invite_code: inviteCode,
          total_rounds: 999, // High number - Game Master controls rounds manually
          status: 'waiting',
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add game master as a player
      await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          user_id: userId,
        });

      router.push(`/games/word-imposter/${game.id}/master`);
    } catch (err) {
      setError('Failed to create game. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Link href="/games" className="text-white/70 hover:text-white text-sm mb-6 inline-block">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Create Word Imposter Game
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Set up your game and invite players!
          </p>

          <div className="space-y-6">
            <p className="text-sm text-gray-600 text-center">
              You'll control the number of rounds manually during the game.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateGame}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

