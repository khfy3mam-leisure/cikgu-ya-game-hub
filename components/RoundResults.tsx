'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Round, GamePlayer, Vote } from '@/types/game';
import PlayerAvatar from './PlayerAvatar';

interface RoundResultsProps {
  round: Round;
  players: GamePlayer[];
  userId: string;
}

export default function RoundResults({ round, players, userId }: RoundResultsProps) {
  const [votedOutPlayer, setVotedOutPlayer] = useState<GamePlayer | null>(null);
  const [imposterPlayer, setImposterPlayer] = useState<GamePlayer | null>(null);
  const [userPlayer, setUserPlayer] = useState<GamePlayer | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadRoundResults();
  }, [round.id, players, userId]);

  // Update user player when players array updates (points will be updated)
  useEffect(() => {
    const userP = players.find(p => p.user_id === userId);
    setUserPlayer(userP || null);
  }, [players, userId]);

  const loadRoundResults = async () => {
    try {
      // Find imposter
      const imposter = players.find(p => p.user_id === round.imposter_id);
      setImposterPlayer(imposter || null);

      // Find current user's player data
      const userP = players.find(p => p.user_id === userId);
      setUserPlayer(userP || null);

      // Get votes to find who was voted out
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', round.id);

      if (votesError) throw votesError;

      // Count votes
      const voteCounts: Record<string, number> = {};
      votes?.forEach((vote) => {
        if (vote.voted_for_id) {
          voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1;
        }
      });

      // Find player with most votes
      const maxVotes = Math.max(...Object.values(voteCounts), 0);
      const votedOutPlayerId = Object.keys(voteCounts).find(
        (playerId) => voteCounts[playerId] === maxVotes
      );

      if (votedOutPlayerId) {
        const votedOut = players.find(p => p.user_id === votedOutPlayerId);
        setVotedOutPlayer(votedOut || null);
      }

      // Calculate points earned this round
      const isImposter = round.imposter_id === userId;
      const isImposterVotedOut = votedOutPlayerId === round.imposter_id;
      let earned = 0;

      if (isImposter) {
        if (!isImposterVotedOut) {
          earned = 1; // Survived
          // Check if guessed word correctly
          const { data: guess } = await supabase
            .from('imposter_guesses')
            .select('*')
            .eq('round_id', round.id)
            .eq('imposter_id', userId)
            .single();

          if (guess?.is_correct) {
            earned += 1; // Bonus point
          }
        }
      } else {
        if (isImposterVotedOut) {
          earned = 1; // Voted out imposter
        }
      }

      setPointsEarned(earned);
    } catch (err) {
      console.error('Error loading round results:', err);
    }
  };

  const isImposter = round.imposter_id === userId;
  const isWinner = (round.winner === 'imposter' && isImposter) || 
                   (round.winner === 'non_imposters' && !isImposter);

  return (
    <div className="bg-white rounded-xl p-3 space-y-3">
      <div className="text-center">
        <div className="text-2xl mb-1">🎉</div>
        <div className="text-sm font-bold text-gray-800 mb-1">
          Complete!
        </div>
        <div className={`text-xs font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
          {isWinner ? '✓ You Won!' : '✗ You Lost'}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-2 space-y-2">
        {imposterPlayer?.user && (
          <div className="text-xs">
            <div className="font-semibold text-gray-600 mb-1">The Imposter Was:</div>
            <div className="flex items-center gap-2">
              <PlayerAvatar user={imposterPlayer.user} size={32} />
              <span className="font-bold text-gray-800">{imposterPlayer.user.username}</span>
            </div>
          </div>
        )}

        {votedOutPlayer?.user && (
          <div className="text-xs">
            <div className="font-semibold text-gray-600 mb-1">Voted Out:</div>
            <div className="flex items-center gap-2">
              <PlayerAvatar user={votedOutPlayer.user} size={32} />
              <span className="font-bold text-gray-800">{votedOutPlayer.user.username}</span>
              {votedOutPlayer.user_id === round.imposter_id && (
                <span className="text-green-600 font-bold">✓ Correct!</span>
              )}
            </div>
          </div>
        )}

        <div className="text-xs">
          <div className="font-semibold text-gray-600 mb-1">Points This Round:</div>
          <div className="text-lg font-bold text-purple-600">
            +{pointsEarned} {pointsEarned === 1 ? 'point' : 'points'}
          </div>
        </div>

        {userPlayer && (
          <div className="text-xs">
            <div className="font-semibold text-gray-600">Total Points:</div>
            <div className="text-lg font-bold text-gray-800">
              {userPlayer.total_points} {userPlayer.total_points === 1 ? 'point' : 'points'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

