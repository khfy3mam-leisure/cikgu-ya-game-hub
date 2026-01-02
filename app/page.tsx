import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bowling.jpg"
          alt="Family Game Night"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/80 via-pink-500/80 to-red-500/80"></div>
      </div>
      
      {/* Content */}
      <div className="text-center space-y-8 max-w-md relative z-10">
        <div className="space-y-4 animate-bounce">
          <h1 className="text-6xl md:text-7xl font-bold text-white drop-shadow-2xl">
            Cikgu Ya
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-300 drop-shadow-lg">
            Game Hub
          </h2>
        </div>
        
        <p className="text-xl text-white/90 font-semibold drop-shadow-md">
          Where family fun meets digital excitement! 🎮
        </p>
        
        <div className="space-y-4 pt-8">
          <Link 
            href="/games"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform duration-200 hover:shadow-white/50"
          >
            Let's Play! 🚀
          </Link>
        </div>
        
        <div className="pt-8 text-white/80 text-sm">
          <p>Gather your family, grab your phones,</p>
          <p>and let the games begin! 🎉</p>
        </div>
      </div>
    </div>
  );
}
