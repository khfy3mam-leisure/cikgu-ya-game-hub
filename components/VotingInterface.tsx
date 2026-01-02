'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Round, GamePlayer } from '@/types/game';
import PlayerAvatar from './PlayerAvatar';

interface VotingInterfaceProps {
  round: Round;
  players: GamePlayer[];
  userId: string;
}

export default function VotingInterface({ round, players, userId }: VotingInterfaceProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    loadVote();
    loadAllVotes();
    subscribeToVotes();
  }, [round.id, userId]);

  const loadVote = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', round.id)
        .eq('voter_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setHasVoted(true);
        setSelectedPlayer(data.voted_for_id);
      }
    } catch (err) {
      console.error('Error loading vote:', err);
    }
  };

  const loadAllVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', round.id);

      if (error) throw error;

      const voteCounts: Record<string, number> = {};
      data?.forEach((vote) => {
        if (vote.voted_for_id) {
          voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1;
        }
      });
      setVotes(voteCounts);
    } catch (err) {
      console.error('Error loading votes:', err);
    }
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel(`votes-${round.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `round_id=eq.${round.id}`,
      }, () => {
        loadAllVotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleVote = async (playerId: string) => {
    if (hasVoted) return;

    try {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', round.id)
        .eq('voter_id', userId)
        .single();

      if (existingVote) {
        await supabase
          .from('votes')
          .update({ voted_for_id: playerId })
          .eq('id', existingVote.id);
      } else {
        await supabase
          .from('votes')
          .insert({
            round_id: round.id,
            voter_id: userId,
            voted_for_id: playerId,
          });
      }

      setHasVoted(true);
      setSelectedPlayer(playerId);
    } catch (err) {
      console.error('Error submitting vote:', err);
    }
  };

  const otherPlayers = players.filter(p => p.user_id !== userId);

  return (
    <div className="bg-white rounded-xl p-3">
      <div className="text-xs font-semibold text-gray-600 mb-2">
        {hasVoted ? '✓ Vote Submitted' : 'Vote for Imposter'}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {otherPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => handleVote(player.user_id!)}
            disabled={hasVoted}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
              selectedPlayer === player.user_id
                ? 'bg-purple-100 border-2 border-purple-500'
                : hasVoted
                ? 'bg-gray-50 opacity-60'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <PlayerAvatar user={player.user!} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">
                {player.user?.username}
              </div>
              {votes[player.user_id!] > 0 && (
                <div className="text-xs text-gray-500">
                  {votes[player.user_id!]} vote{votes[player.user_id!] !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            {selectedPlayer === player.user_id && (
              <div className="text-purple-600">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
