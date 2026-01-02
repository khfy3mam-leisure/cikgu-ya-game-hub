import { Round } from '@/types/game';

interface RoleDisplayProps {
  round: Round;
  isImposter: boolean;
}

export default function RoleDisplay({ round, isImposter }: RoleDisplayProps) {
  return (
    <div className={`rounded-2xl shadow-2xl p-6 ${isImposter ? 'bg-red-50 border-4 border-red-400' : 'bg-green-50 border-4 border-green-400'}`}>
      <div className="text-center">
        <div className="text-4xl mb-4">
          {isImposter ? '🕵️' : '✅'}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isImposter ? 'You are the IMPOSTER!' : 'You are NOT the imposter'}
        </h2>
        
        <div className="bg-white rounded-xl p-4 mt-4">
          {isImposter ? (
            <div>
              <div className="text-sm text-gray-600 mb-2">Your Bonus Hint:</div>
              <div className="text-2xl font-bold text-red-600">{round.bonus_hint}</div>
              <div className="text-xs text-gray-500 mt-2">
                Try to blend in and guess the secret word!
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-gray-600 mb-2">Secret Word:</div>
              <div className="text-2xl font-bold text-green-600">{round.secret_word}</div>
              <div className="text-xs text-gray-500 mt-2">
                Find the imposter who doesn't know this word!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

