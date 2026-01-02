'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { calculateRoundResults } from '@/lib/game-logic';
import { Game, GamePlayer, Round } from '@/types/game';

interface GameMasterControlsProps {
  game: Game;
  players: GamePlayer[];
  currentRound: Round | null;
  gameId: string;
}

export default function GameMasterControls({ game, players, currentRound, gameId }: GameMasterControlsProps) {
  const [loading, setLoading] = useState(false);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [selectedImposters, setSelectedImposters] = useState<string[]>([]);
  const [secretWord, setSecretWord] = useState('');
  const [bonusHint, setBonusHint] = useState('');
  const supabase = createClient();

  const handleStartRound = async () => {
    if (selectedImposters.length === 0 || !secretWord || !bonusHint) {
      alert('Please fill all fields and select at least one imposter');
      return;
    }

    setLoading(true);
    try {
      const roundNumber = game.current_round + 1;

      // Store first imposter in imposter_id for backward compatibility
      const firstImposter = selectedImposters[0];

      const { data: round, error: roundError } = await supabase
        .from('rounds')
        .insert({
          game_id: gameId,
          round_number: roundNumber,
          secret_word: secretWord,
          bonus_hint: bonusHint,
          imposter_id: firstImposter,
          imposter_ids: selectedImposters, // Store all imposter IDs as JSON array
          status: 'setup',
        })
        .select()
        .single();

      if (roundError) throw roundError;

      await supabase
        .from('games')
        .update({
          current_round: roundNumber,
          status: 'role_assignment',
        })
        .eq('id', gameId);

      setShowRoleAssignment(false);
      setSecretWord('');
      setBonusHint('');
      setSelectedImposters([]);
    } catch (err) {
      console.error('Error starting round:', err);
      alert('Failed to start round');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Game['status']) => {
    setLoading(true);
    try {
      await supabase
        .from('games')
        .update({ status: newStatus })
        .eq('id', gameId);

      if (currentRound && newStatus === 'discussion') {
        await supabase
          .from('rounds')
          .update({ status: 'discussion' })
          .eq('id', currentRound.id);
      } else if (currentRound && newStatus === 'voting') {
        await supabase
          .from('rounds')
          .update({ status: 'voting' })
          .eq('id', currentRound.id);
      } else if (currentRound && newStatus === 'round_end') {
        await calculateRoundResults(gameId, currentRound.id);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    // Game Master decides when to end game manually
    // Just reset for next round
    await supabase
      .from('games')
      .update({ status: 'waiting' })
      .eq('id', gameId);
    setShowRoleAssignment(true);
  };

  const handleEndGame = async () => {
    // Game Master manually ends the game
    await supabase
      .from('games')
      .update({ status: 'game_end' })
      .eq('id', gameId);
  };

  // Start Round Setup
  if (game.status === 'waiting' || game.status === 'round_end') {
    return (
      <div className="bg-white rounded-xl p-3">
        <div className="text-xs font-semibold text-gray-600 mb-2">
          {game.current_round === 0 ? 'Start Game' : 'Start Next Round'}
        </div>
        {!showRoleAssignment ? (
          <button
            onClick={() => setShowRoleAssignment(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
          >
            Set Up Round
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-gray-600 mb-1">Select Imposter(s) (hold Ctrl/Cmd to select multiple):</div>
            <select
              multiple
              value={selectedImposters}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedImposters(selected);
              }}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded min-h-[100px]"
              size={Math.min(players.length, 5)}
            >
              {players.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.user?.username || 'Unknown'}
                </option>
              ))}
            </select>
            {selectedImposters.length > 0 && (
              <div className="text-xs text-gray-500">
                Selected: {selectedImposters.length} imposter{selectedImposters.length !== 1 ? 's' : ''}
              </div>
            )}
            <input
              type="text"
              value={secretWord}
              onChange={(e) => setSecretWord(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="Secret word (non-imposters)"
            />
            <input
              type="text"
              value={bonusHint}
              onChange={(e) => setBonusHint(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="Bonus hint (imposter)"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRoleAssignment(false);
                  setSecretWord('');
                  setBonusHint('');
                  setSelectedImposters([]);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-1 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStartRound}
                disabled={loading}
                className="flex-1 bg-purple-500 text-white py-1 rounded text-xs font-semibold disabled:opacity-50"
              >
                {loading ? '...' : 'Start'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Role Assignment / Word Distribution
  if (game.status === 'role_assignment' || game.status === 'word_distribution') {
    return (
      <div className="bg-white rounded-xl p-3">
        <button
          onClick={() => handleUpdateStatus('discussion')}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '...' : '→ Start Discussion'}
        </button>
      </div>
    );
  }

  // Discussion Phase
  if (game.status === 'discussion') {
    return (
      <div className="bg-white rounded-xl p-3">
        <button
          onClick={() => handleUpdateStatus('voting')}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? '...' : '→ Start Voting'}
        </button>
      </div>
    );
  }

  // Voting Phase
  if (game.status === 'voting') {
    return (
      <div className="bg-white rounded-xl p-3">
        <div className="text-xs text-gray-600 mb-2 text-center">Waiting for votes...</div>
        <button
          onClick={() => handleUpdateStatus('round_end')}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? '...' : '✓ End Round & Calculate'}
        </button>
      </div>
    );
  }

  // Round End
  if (game.status === 'round_end') {
    return (
      <div className="bg-white rounded-xl p-3 space-y-2">
        <button
          onClick={handleNextRound}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50"
        >
          → Next Round
        </button>
        <button
          onClick={handleEndGame}
          disabled={loading}
          className="w-full bg-gray-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          🏆 End Game
        </button>
      </div>
    );
  }

  // Game End
  if (game.status === 'game_end') {
    return (
      <div className="bg-white rounded-xl p-3 text-center">
        <div className="text-2xl mb-2">🎉</div>
        <div className="text-xs font-bold text-gray-800 mb-2">Game Complete!</div>
        <Link
          href={`/games/word-imposter/${gameId}/leaderboard`}
          className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold text-xs hover:scale-105 transition-transform"
        >
          View Leaderboard
        </Link>
      </div>
    );
  }

  return null;
}
