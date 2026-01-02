import { createClient } from '@/lib/supabase/client';
import { Round, GamePlayer } from '@/types/game';

export async function calculateRoundResults(gameId: string, roundId: string) {
  const supabase = createClient();

  try {
    // Get round data
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    if (roundError || !round) throw roundError;

    // Get all votes
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('round_id', roundId);

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

    // Determine winner
    const isImposterVotedOut = votedOutPlayerId === round.imposter_id;
    const winner = isImposterVotedOut ? 'non_imposters' : 'imposter';

    // Update round with winner
    await supabase
      .from('rounds')
      .update({ winner, status: 'completed' })
      .eq('id', roundId);

    // Get all game players
    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId);

    if (playersError) throw playersError;

    // Calculate and update points
    for (const player of players || []) {
      let pointsToAdd = 0;

      if (player.user_id === round.imposter_id) {
        // Imposter gets 1 point if they survive
        if (!isImposterVotedOut) {
          pointsToAdd = 1;

          // Check if imposter guessed the word correctly
          const { data: guess } = await supabase
            .from('imposter_guesses')
            .select('*')
            .eq('round_id', roundId)
            .eq('imposter_id', round.imposter_id)
            .single();

          if (guess?.is_correct) {
            pointsToAdd += 1; // Bonus point
          }
        }
      } else {
        // Non-imposters get 1 point if they vote out the imposter
        if (isImposterVotedOut) {
          pointsToAdd = 1;
        }
      }

      if (pointsToAdd > 0) {
        await supabase
          .from('game_players')
          .update({ total_points: player.total_points + pointsToAdd })
          .eq('id', player.id);
      }
    }

    return { winner, isImposterVotedOut };
  } catch (err) {
    console.error('Error calculating round results:', err);
    throw err;
  }
}

