'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Round, GamePlayer, PlayerClue } from '@/types/game';
import PlayerAvatar from './PlayerAvatar';

interface RoundResultsProps {
  round: Round;
  players: GamePlayer[];
  userId: string;
}

export default function RoundResults({ round, players, userId }: RoundResultsProps) {
  const [votedOutPlayers, setVotedOutPlayers] = useState<GamePlayer[]>([]);
  const [imposterPlayers, setImposterPlayers] = useState<GamePlayer[]>([]);
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
      // Get all imposter IDs (support multiple imposters)
      const imposterIds = (round.imposter_ids && round.imposter_ids.length > 0)
        ? round.imposter_ids
        : [round.imposter_id]; // Fallback to single imposter

      // Find all imposters
      const imposters = players.filter(p => imposterIds.includes(p.user_id!));
      setImposterPlayers(imposters);

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

      // Find player(s) with most votes
      const maxVotes = Math.max(...Object.values(voteCounts), 0);
      const votedOutPlayerIds = Object.keys(voteCounts).filter(
        (playerId) => voteCounts[playerId] === maxVotes
      );

      if (votedOutPlayerIds.length > 0) {
        const votedOut = players.filter(p => votedOutPlayerIds.includes(p.user_id!));
        setVotedOutPlayers(votedOut);
      }

      // Calculate points earned this round
      const isImposter = imposterIds.includes(userId);
      const votedOutImposterIds = votedOutPlayerIds.filter(id => imposterIds.includes(id));
      const votedOutImposterCount = votedOutImposterIds.length;
      let earned = 0;

      if (isImposter) {
        const wasVotedOut = votedOutPlayerIds.includes(userId);
        if (!wasVotedOut) {
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
        // Non-imposters get 1 point per imposter voted out
        earned = votedOutImposterCount;
      }

      setPointsEarned(earned);
    } catch (err) {
      console.error('Error loading round results:', err);
    }
  };

  const isImposter = (round.imposter_ids && round.imposter_ids.includes(userId)) || round.imposter_id === userId;
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
        {imposterPlayers.length > 0 && (
          <div className="text-xs">
            <div className="font-semibold text-gray-600 mb-1">
              The Imposter{imposterPlayers.length > 1 ? 's Were' : ' Was'}:
            </div>
            {imposterPlayers.map((imposter) => (
              <div key={imposter.id} className="flex items-center gap-2 mb-1">
                <PlayerAvatar user={imposter.user!} size={32} />
                <span className="font-bold text-gray-800">{imposter.user?.username}</span>
              </div>
            ))}
          </div>
        )}

        {votedOutPlayers.length > 0 && (
          <div className="text-xs">
            <div className="font-semibold text-gray-600 mb-1">Voted Out:</div>
            {votedOutPlayers.map((votedOut) => {
              const wasImposter = imposterPlayers.some(imp => imp.user_id === votedOut.user_id);
              return (
                <div key={votedOut.id} className="flex items-center gap-2 mb-1">
                  <PlayerAvatar user={votedOut.user!} size={32} />
                  <span className="font-bold text-gray-800">{votedOut.user?.username}</span>
                  {wasImposter && (
                    <span className="text-green-600 font-bold">✓ Correct!</span>
                  )}
                </div>
              );
            })}
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
