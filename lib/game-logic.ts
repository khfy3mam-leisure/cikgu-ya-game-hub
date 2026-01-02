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

    // Use Game Master's selection of who was voted out
    const votedOutPlayerId = round.voted_out_player_id;

    // Get all imposter IDs (support multiple imposters)
    const imposterIds = (round.imposter_ids && round.imposter_ids.length > 0)
      ? round.imposter_ids
      : [round.imposter_id]; // Fallback to single imposter for backward compatibility

    // Check which imposters were voted out
    const votedOutImposters = imposterIds.filter((id: string) => id === votedOutPlayerId);
    const votedOutImposterCount = votedOutImposters.length;
    const survivingImposters = imposterIds.filter((id: string) => id !== votedOutPlayerId);

    // Determine winner: non-imposters win if at least one imposter was voted out
    const isAnyImposterVotedOut = votedOutImposterCount > 0;
    const winner = isAnyImposterVotedOut ? 'non_imposters' : 'imposter';

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

      // Check if player is an imposter
      const isImposter = imposterIds.includes(player.user_id!);
      const wasVotedOut = player.user_id === votedOutPlayerId;

      if (isImposter) {
        // Imposter gets 1 point if they survive (not voted out)
        if (!wasVotedOut) {
          pointsToAdd = 1;

          // Check if imposter guessed the word correctly
          const { data: guess } = await supabase
            .from('imposter_guesses')
            .select('*')
            .eq('round_id', roundId)
            .eq('imposter_id', player.user_id)
            .single();

          if (guess?.is_correct) {
            pointsToAdd += 1; // Bonus point
          }
        }
        // Voted out imposters get 0 points
      } else {
        // Non-imposters get 1 point per imposter voted out
        pointsToAdd = votedOutImposterCount;
      }

      if (pointsToAdd > 0) {
        await supabase
          .from('game_players')
          .update({ total_points: player.total_points + pointsToAdd })
          .eq('id', player.id);
      }
    }

    return { winner, isImposterVotedOut: isAnyImposterVotedOut };
  } catch (err) {
    console.error('Error calculating round results:', err);
    throw err;
  }
}
