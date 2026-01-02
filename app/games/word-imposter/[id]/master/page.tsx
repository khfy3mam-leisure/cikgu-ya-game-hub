'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Game, GamePlayer, Round } from '@/types/game';
import GameMasterControls from '@/components/GameMasterControls';
import PlayerList from '@/components/PlayerList';
import SpotlightPlayer from '@/components/SpotlightPlayer';

export default function GameMasterPage() {
  const params = useParams();
  const gameId = params.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadGameData();
    const unsubscribe = subscribeToGame();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [gameId]);

  const loadGameData = async () => {
    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select(`
          *,
          user:users(*)
        `)
        .eq('game_id', gameId);

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      if (gameData.current_round > 0) {
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .select('*')
          .eq('game_id', gameId)
          .eq('round_number', gameData.current_round)
          .single();

        if (!roundError && roundData) {
          setCurrentRound(roundData);
        }
      }
    } catch (err) {
      console.error('Error loading game data:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToGame = () => {
    const channel = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        const updatedGame = payload.new as Game;
        setGame(updatedGame);
        if (updatedGame.current_round > 0) {
          loadGameData();
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        loadGameData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rounds',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        loadGameData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">Game not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Compact Header */}
      <div className="bg-white/10 backdrop-blur-sm p-2 flex justify-between items-center text-white text-xs flex-shrink-0">
        <div className="font-bold">Game Master</div>
        <div className="capitalize">{game.status.replace('_', ' ')}</div>
        <div className="flex items-center gap-2">
          <Link href={`/games/word-imposter/${gameId}/leaderboard`} className="text-yellow-300 hover:text-yellow-100">
            📊
          </Link>
          <div className="font-mono text-yellow-300">{game.invite_code}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join/${game.invite_code}`);
              alert('Copied!');
            }}
            className="text-xs bg-purple-500 px-2 py-1 rounded"
          >
            📋
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <PlayerList players={players} />

        {currentRound && (game.status === 'discussion' || game.status === 'round_end') && (
          <SpotlightPlayer 
            round={currentRound}
            players={players}
            gameId={gameId}
            isGameMaster={true}
            game={game}
          />
        )}


        <GameMasterControls 
          game={game}
          players={players}
          currentRound={currentRound}
          gameId={gameId}
        />
      </div>
    </div>
  );
}
