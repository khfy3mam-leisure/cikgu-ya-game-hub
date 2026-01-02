import { User } from '@/types/game';

interface PlayerAvatarProps {
  user: User | null | undefined;
  size?: number;
}

export default function PlayerAvatar({ user, size = 40 }: PlayerAvatarProps) {
  if (!user || !user.username) {
    return (
      <div
        className="rounded-full bg-gray-300 flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ?
      </div>
    );
  }

  const initials = user.username
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (user.profile_picture_url) {
    return (
      <img
        src={user.profile_picture_url}
        alt={user.username}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

