'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Game, GamePlayer } from '@/types/game';
import PlayerAvatar from '@/components/PlayerAvatar';
import Link from 'next/link';

export default function LeaderboardPage() {
  const params = useParams();
  const gameId = params.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadLeaderboard();
  }, [gameId]);

  const loadLeaderboard = async () => {
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      // Check if user is game master
      if (userId && gameData.game_master_id === userId) {
        setIsGameMaster(true);
      }

      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select(`
          *,
          user:users(*)
        `)
        .eq('game_id', gameId)
        .order('total_points', { ascending: false });

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.total_points - a.total_points);
  const winner = sortedPlayers[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-600 mb-6">
            {game?.status === 'game_end' 
              ? 'Game Complete!'
              : 'Current Standings'
            }
          </p>

          {winner && game?.status === 'game_end' && (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl">
              <div className="text-5xl mb-4">👑</div>
              <div className="flex justify-center items-center gap-4">
                <PlayerAvatar user={winner.user!} size={80} />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{winner.user?.username}</div>
                  <div className="text-xl text-gray-700">{winner.total_points} points</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  index === 0
                    ? 'bg-yellow-50 border-2 border-yellow-400'
                    : 'bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold text-gray-400 w-8">
                  #{index + 1}
                </div>
                <PlayerAvatar user={player.user!} size={48} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{player.user?.username}</div>
                </div>
                <div className="text-xl font-bold text-purple-600">
                  {player.total_points} pts
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {game?.status === 'game_end' ? (
              <>
                <Link
                  href="/games/word-imposter/create"
                  className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
                >
                  Start New Game
                </Link>
                <Link
                  href="/games"
                  className="block w-full bg-gray-200 text-gray-800 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Games
                </Link>
              </>
            ) : (
              <Link
                href={isGameMaster 
                  ? `/games/word-imposter/${gameId}/master`
                  : `/games/word-imposter/${gameId}/player`
                }
                className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
              >
                Back to Game
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

