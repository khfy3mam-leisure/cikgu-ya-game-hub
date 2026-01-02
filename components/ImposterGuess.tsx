'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Round } from '@/types/game';

interface ImposterGuessProps {
  round: Round;
  secretWord: string;
  userId: string;
}

export default function ImposterGuess({ round, secretWord, userId }: ImposterGuessProps) {
  const [guessedWord, setGuessedWord] = useState('');
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadExistingGuess();
  }, [round.id, userId]);

  const loadExistingGuess = async () => {
    try {
      const { data, error } = await supabase
        .from('imposter_guesses')
        .select('*')
        .eq('round_id', round.id)
        .eq('imposter_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setHasGuessed(true);
        setGuessedWord(data.guessed_word);
        setIsCorrect(data.is_correct);
      }
    } catch (err) {
      console.error('Error loading guess:', err);
    }
  };

  const handleSubmit = async () => {
    if (!guessedWord.trim() || hasGuessed) return;

    const correct = guessedWord.trim().toLowerCase() === secretWord.toLowerCase();

    try {
      const { data: existing } = await supabase
        .from('imposter_guesses')
        .select('*')
        .eq('round_id', round.id)
        .eq('imposter_id', userId)
        .single();

      if (existing) {
        await supabase
          .from('imposter_guesses')
          .update({
            guessed_word: guessedWord.trim(),
            is_correct: correct,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('imposter_guesses')
          .insert({
            round_id: round.id,
            imposter_id: userId,
            guessed_word: guessedWord.trim(),
            is_correct: correct,
          });
      }

      setHasGuessed(true);
      setIsCorrect(correct);
    } catch (err) {
      console.error('Error submitting guess:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl p-3">
      <div className="text-xs font-semibold text-gray-600 mb-2">Guess Secret Word</div>
      {hasGuessed ? (
        <div className={`p-2 rounded-lg text-center ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="text-sm font-bold mb-1">{isCorrect ? '🎉 Correct!' : '❌ Wrong'}</div>
          <div className="text-xs">Your guess: {guessedWord}</div>
          {!isCorrect && (
            <div className="text-xs mt-1">Secret: {secretWord}</div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={guessedWord}
            onChange={(e) => setGuessedWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Enter guess..."
          />
          <button
            onClick={handleSubmit}
            disabled={!guessedWord.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold text-xs hover:bg-purple-600 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
