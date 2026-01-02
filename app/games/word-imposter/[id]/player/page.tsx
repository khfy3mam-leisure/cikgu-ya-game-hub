'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Game, GamePlayer, Round, User } from '@/types/game';
import RoleDisplay from '@/components/RoleDisplay';
import FullScreenSpotlight from '@/components/FullScreenSpotlight';
import VotingInterface from '@/components/VotingInterface';
import ImposterGuess from '@/components/ImposterGuess';
import PlayerAvatar from '@/components/PlayerAvatar';
import RoundResults from '@/components/RoundResults';

export default function PlayerPage() {
  const params = useParams();
  const gameId = params.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    loadGameData(userId);
    const unsubscribe = subscribeToGame();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [gameId]);

  const loadGameData = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

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

        if (roundError && roundError.code !== 'PGRST116') {
          console.error('Error loading round:', roundError);
          setCurrentRound(null);
        } else if (roundData) {
          setCurrentRound(roundData);
        } else {
          setCurrentRound(null);
        }
      } else {
        setCurrentRound(null);
      }
    } catch (err) {
      console.error('Error loading game data:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToGame = () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) return;

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
          loadGameData(userId);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rounds',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        loadGameData(userId);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        loadGameData(userId);
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

  if (!game || !user) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">Game not found</div>
      </div>
    );
  }

  // Check if user is an imposter (support multiple imposters)
  const isImposter = currentRound 
    ? (currentRound.imposter_ids && currentRound.imposter_ids.includes(user.id)) || currentRound.imposter_id === user.id
    : false;
  const isSpotlighted = currentRound?.spotlight_player_id === user.id;

  const showFullScreenSpotlight = currentRound && (game.status === 'discussion' || game.status === 'round_end');

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Full Screen Spotlight */}
      {showFullScreenSpotlight && (
        <FullScreenSpotlight
          round={currentRound}
          game={game}
          players={players}
          gameId={gameId}
          isGameMaster={false}
        />
      )}

      {/* Compact Header - Hidden when spotlight is showing */}
      {!showFullScreenSpotlight && (
        <div className="bg-white/10 backdrop-blur-sm p-2 flex justify-between items-center text-white text-xs">
          <div className="font-bold">Word Imposter</div>
          <div className="capitalize">{game.status.replace('_', ' ')}</div>
          <Link href={`/games/word-imposter/${gameId}/leaderboard`} className="text-yellow-300 hover:text-yellow-100">
            📊
          </Link>
        </div>
      )}

      {/* Main Content - Fits in remaining space */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Waiting State */}
        {!currentRound && game.status === 'waiting' && (
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">👋</div>
            <div className="font-bold text-gray-800 mb-1">Waiting for round to start</div>
            <div className="text-xs text-gray-500">{players.length} players</div>
          </div>
        )}

        {/* Setup Waiting */}
        {!currentRound && game.status !== 'waiting' && (
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-sm text-gray-600">Game Master is setting up...</div>
          </div>
        )}

        {/* Role & Word Display - Compact */}
        {currentRound && (
          <div className={`rounded-xl p-3 ${isImposter ? 'bg-red-50 border-2 border-red-400' : 'bg-green-50 border-2 border-green-400'}`}>
            <div className="text-center">
              <div className="text-2xl mb-1">{isImposter ? '🕵️' : '✅'}</div>
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {isImposter ? 'IMPOSTER' : 'NOT IMPOSTER'}
              </div>
              <div className={`text-lg font-bold ${isImposter ? 'text-red-600' : 'text-green-600'}`}>
                {isImposter ? currentRound.bonus_hint : currentRound.secret_word}
              </div>
              {isImposter && currentRound.imposter_ids && currentRound.imposter_ids.length > 1 && (
                <div className="text-xs text-red-500 mt-1">
                  There {currentRound.imposter_ids.length === 2 ? 'is' : 'are'} {currentRound.imposter_ids.length} imposter{currentRound.imposter_ids.length > 1 ? 's' : ''}!
                </div>
              )}
            </div>
          </div>
        )}



        {/* Voting - Compact */}
        {currentRound && game.status === 'voting' && (
          <VotingInterface 
            round={currentRound}
            players={players}
            userId={user.id}
          />
        )}

        {/* Imposter Guess - Compact */}
        {currentRound && game.status === 'voting' && isImposter && (
          <ImposterGuess 
            round={currentRound}
            secretWord={currentRound.secret_word}
            userId={user.id}
          />
        )}

        {/* End - Show Results */}
        {game.status === 'round_end' && currentRound && (
          <RoundResults 
            round={currentRound}
            players={players}
            userId={user.id}
          />
        )}

        {/* Game End */}
        {game.status === 'game_end' && (
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-sm font-bold text-gray-800 mb-3">Game Complete!</div>
            <Link
              href={`/games/word-imposter/${gameId}/leaderboard`}
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
            >
              View Leaderboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
