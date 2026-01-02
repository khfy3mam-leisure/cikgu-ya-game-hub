import { GamePlayer } from '@/types/game';
import PlayerAvatar from './PlayerAvatar';

interface PlayerListProps {
  players: GamePlayer[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="bg-white rounded-xl p-3">
      <div className="text-xs font-semibold text-gray-600 mb-2">Players ({players.length})</div>
      <div className="grid grid-cols-3 gap-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg"
          >
            <PlayerAvatar user={player.user!} size={32} />
            <div className="text-xs font-semibold text-gray-800 truncate w-full text-center">
              {player.user?.username || 'Unknown'}
            </div>
            <div className="text-xs text-gray-500">
              {player.total_points}pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
