'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Round, GamePlayer } from '@/types/game';
import PlayerAvatar from './PlayerAvatar';

interface SpotlightPlayerProps {
  round: Round;
  players: GamePlayer[];
  gameId: string;
  isGameMaster: boolean;
  game?: { status: string };
}

export default function SpotlightPlayer({ round, players, gameId, isGameMaster, game }: SpotlightPlayerProps) {
  const [spotlightPlayer, setSpotlightPlayer] = useState<GamePlayer | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // At round end, show imposter
    if (game?.status === 'round_end') {
      const imposter = players.find(p => p.user_id === round.imposter_id);
      setSpotlightPlayer(imposter || null);
      return;
    }

    // During game, show spotlight player
    if (round.spotlight_player_id) {
      const player = players.find(p => p.user_id === round.spotlight_player_id);
      setSpotlightPlayer(player || null);
    } else {
      setSpotlightPlayer(null);
    }
    const unsubscribe = subscribeToSpotlight();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [round.spotlight_player_id, round.id, round.imposter_id, game?.status, players]);

  const subscribeToSpotlight = () => {
    const channel = supabase
      .channel(`spotlight-${round.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rounds',
        filter: `id=eq.${round.id}`,
      }, (payload) => {
        const updatedRound = payload.new as Round;
        if (updatedRound.spotlight_player_id) {
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
    if (!isGameMaster) return;

    try {
      await supabase
        .from('rounds')
        .update({ spotlight_player_id: playerId })
        .eq('id', round.id);
    } catch (err) {
      console.error('Error updating spotlight:', err);
    }
  };

  const isImposterReveal = game?.status === 'round_end';

  return (
    <div className="bg-white rounded-xl p-3">
      <div className="text-xs font-semibold text-gray-600 mb-2 text-center">
        {isImposterReveal ? '🕵️ The Imposter' : '🎯 Current Turn'}
      </div>
      {spotlightPlayer ? (
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative z-10">
                <PlayerAvatar user={spotlightPlayer.user!} size={60} />
              </div>
            </div>
          </div>
          <div className="text-sm font-bold text-gray-800">
            {spotlightPlayer.user?.username}
          </div>
          {isImposterReveal && (
            <div className="text-xs text-gray-600 mt-1">Was the Imposter!</div>
          )}
        </div>
      ) : (
        <div className="text-center text-xs text-gray-400">No one</div>
      )}
      {isGameMaster && (
        <select
          value={round.spotlight_player_id || ''}
          onChange={(e) => handleChangeSpotlight(e.target.value)}
          className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded-lg"
        >
          <option value="">Select player...</option>
          {players.map((p) => (
            <option key={p.user_id} value={p.user_id}>
              {p.user?.username || 'Unknown'}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
