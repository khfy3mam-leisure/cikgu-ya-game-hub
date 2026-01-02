import Link from 'next/link';

const games = [
  {
    id: 'word-imposter',
    name: 'Word Imposter',
    description: 'Find the imposter among you! Can you spot who doesn\'t know the secret word?',
    emoji: '🕵️',
    color: 'from-blue-500 to-cyan-500',
    href: '/games/word-imposter/create',
  },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-white/70 hover:text-white text-sm">
              ← Back to Home
            </Link>
            <Link href="/profile" className="text-white/70 hover:text-white text-sm">
              👤 Profile
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Game
          </h1>
          <p className="text-white/80 text-lg">
            Pick a game and start the fun!
          </p>
        </div>

        <div className="mb-8">
          <Link
            href="/join"
            className="block bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 text-center"
          >
            <div className="text-4xl mb-3">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2">Join a Game</h2>
            <p className="text-white/80 text-sm">Enter an invite code to join an existing game</p>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.color} p-8 shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-cyan-500/50`}
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {game.emoji}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {game.name}
              </h2>
              <p className="text-white/90 text-sm">
                {game.description}
              </p>
              <div className="mt-4 text-white font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Create Game →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center text-white/60 text-sm">
          <p>More games coming soon! 🎮</p>
        </div>
      </div>
    </div>
  );
}

