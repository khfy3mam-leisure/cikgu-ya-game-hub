'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Round, GamePlayer, Game } from '@/types/game';
import PlayerAvatar from './PlayerAvatar';

interface FullScreenSpotlightProps {
  round: Round | null;
  game: Game;
  players: GamePlayer[];
  gameId: string;
  isGameMaster: boolean;
}

export default function FullScreenSpotlight({ round, game, players, gameId, isGameMaster }: FullScreenSpotlightProps) {
  const [spotlightPlayer, setSpotlightPlayer] = useState<GamePlayer | null>(null);
  const [imposters, setImposters] = useState<GamePlayer[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // At round end, show all imposters
    if (game.status === 'round_end' && round) {
      const imposterIds = round.imposter_ids && round.imposter_ids.length > 0 
        ? round.imposter_ids 
        : [round.imposter_id]; // Fallback to single imposter for backward compatibility
      
      const foundImposters = imposterIds
        .map(id => players.find(p => p.user_id === id))
        .filter((p): p is GamePlayer => p !== undefined);
      
      setImposters(foundImposters);
      // Set first imposter for single display fallback
      setSpotlightPlayer(foundImposters[0] || null);
      return;
    }

    // During game, show spotlight player
    if (round?.spotlight_player_id) {
      const player = players.find(p => p.user_id === round.spotlight_player_id);
      setSpotlightPlayer(player || null);
    } else {
      setSpotlightPlayer(null);
    }

    const unsubscribe = subscribeToSpotlight();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [round?.spotlight_player_id, round?.id, round?.imposter_id, game.status, players]);

  const subscribeToSpotlight = () => {
    if (!round) return;

    const channel = supabase
      .channel(`spotlight-full-${round.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rounds',
        filter: `id=eq.${round.id}`,
      }, (payload) => {
        const updatedRound = payload.new as Round;
        // At round end, show imposter
        if (game.status === 'round_end') {
          const imposter = players.find(p => p.user_id === updatedRound.imposter_id);
          setSpotlightPlayer(imposter || null);
        } else if (updatedRound.spotlight_player_id) {
          const player = players.find(p => p.user_id === updatedRound.spotlight_player_id);
          setSpotlightPlayer(player || null);
        } else {
          setSpotlightPlayer(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleChangeSpotlight = async (playerId: string) => {
    if (!isGameMaster || !round || game.status === 'round_end') return;

    try {
      await supabase
        .from('rounds')
        .update({ spotlight_player_id: playerId })
        .eq('id', round.id);
    } catch (err) {
      console.error('Error updating spotlight:', err);
    }
  };

  // Don't show if no round
  if (!round) {
    return null;
  }

  const isImposterReveal = game.status === 'round_end';
  
  // At round end, show all imposters; otherwise show spotlight player
  if (isImposterReveal && imposters.length === 0 && !spotlightPlayer) {
    return null;
  }
  
  if (!isImposterReveal && !spotlightPlayer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Accessible Header */}
      <div className="bg-white/10 backdrop-blur-sm p-2 flex justify-between items-center text-white text-xs flex-shrink-0 z-50">
        <div className="font-bold">Word Imposter</div>
        <div className="capitalize">{game.status.replace('_', ' ')}</div>
        <Link href={`/games/word-imposter/${gameId}/leaderboard`} className="text-yellow-300 hover:text-yellow-100">
          📊
        </Link>
      </div>
      
      {/* Spotlight Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="text-center px-4 py-8">
        {isImposterReveal && imposters.length > 0 ? (
          // Show all imposters
          <>
            <div className="text-4xl font-bold text-white mb-6">
              🕵️ THE IMPOSTER{imposters.length > 1 ? 'S' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {imposters.map((imposter) => (
                <div key={imposter.id} className="relative">
                  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-60 animate-pulse" style={{ width: '250px', height: '250px', margin: '0 auto' }}></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <PlayerAvatar user={imposter.user!} size={150} />
                    <div className="text-3xl font-bold text-yellow-300 mt-4">
                      {imposter.user?.username}
                    </div>
                    <div className="text-xl text-white/80 mt-2">
                      Was an Imposter!
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Show single spotlight player
          <>
            {/* Glowing Avatar */}
            <div className="relative mb-8 flex justify-center">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-60 animate-pulse" style={{ width: '300px', height: '300px', margin: '0 auto' }}></div>
              <div className="relative z-10">
                <PlayerAvatar user={spotlightPlayer!.user!} size={200} />
              </div>
            </div>

            {/* Title */}
            <div className="text-4xl font-bold text-white mb-4">
              {isImposterReveal ? '🕵️ THE IMPOSTER' : '🎯 CURRENT TURN'}
            </div>

            {/* Player Name */}
            <div className="text-6xl font-bold text-yellow-300 mb-6">
              {spotlightPlayer!.user?.username}
            </div>

            {/* Subtitle */}
            {isImposterReveal ? (
              <div className="text-2xl text-white/80">
                Was the Imposter!
              </div>
            ) : (
              <div className="text-2xl text-white/80">
                It's Your Turn to Speak!
              </div>
            )}
          </>
        )}

        {/* Game Master Controls */}
        {isGameMaster && !isImposterReveal && (
          <div className="mt-12">
            <select
              value={round.spotlight_player_id || ''}
              onChange={(e) => handleChangeSpotlight(e.target.value)}
              className="px-6 py-3 text-lg bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="" className="text-gray-800">Select player...</option>
              {players.map((p) => (
                <option key={p.user_id} value={p.user_id} className="text-gray-800">
                  {p.user?.username || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
