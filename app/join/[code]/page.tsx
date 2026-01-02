'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function JoinGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    joinGame();
  }, [code]);

  const joinGame = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    if (!userId) {
      router.push(`/login?redirect=/join/${code}`);
      return;
    }

    setLoading(true);

    try {
      // Find game by invite code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('invite_code', code.toUpperCase())
        .single();

      if (gameError || !game) {
        setError('Game not found. Please check the invite code.');
        setLoading(false);
        return;
      }

      // Check if already joined
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', game.id)
        .eq('user_id', userId)
        .single();

      if (existingPlayer) {
        // Already joined, redirect to appropriate page
        if (game.game_master_id === userId) {
          router.push(`/games/word-imposter/${game.id}/master`);
        } else {
          router.push(`/games/word-imposter/${game.id}/player`);
        }
        return;
      }

      // Join game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          user_id: userId,
        });

      if (joinError) {
        throw joinError;
      }

      // Redirect to player page
      router.push(`/games/word-imposter/${game.id}/player`);
    } catch (err: any) {
      setError('Failed to join game. Please try again.');
      console.error('Join game error:', err?.message || err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Joining game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/games"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

