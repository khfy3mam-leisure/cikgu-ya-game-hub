# Cikgu Ya Game Hub

A phone-first game hub for family gatherings, featuring the Word Imposter game with real-time synchronization via Supabase.

## Features

- 🎮 **Word Imposter Game**: Find the imposter among you!
- 👥 **User Management**: Simple username-based authentication (no passwords)
- 📸 **Profile Pictures**: Optional selfie uploads for players
- 🎯 **Spotlight Feature**: Game Master controls whose turn it is
- 💬 **Clue Tracking**: Players can input their clue words (Game Master can override)
- 🗳️ **Voting System**: Real-time voting to find the imposter
- 📊 **Point System**: Track points across rounds
- 🏆 **Leaderboard**: See final scores after all rounds

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Get your Supabase project URL and anon key from your Supabase dashboard
2. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zvggvztlfbyqjhsxmjxj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set Up Supabase Storage

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `profile-pictures`
4. Set the bucket to **Public** (for read access)
5. Set **max file size** to **10MB** (this limits each individual file upload)
6. Add the following storage policy:

**Note:** 
- **Individual file limit**: 10MB per image (set in bucket settings and enforced in app code)
- **Total bucket capacity**: 250MB total storage for all files combined (limited by your Supabase plan's storage quota)

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile pictures" ON storage.objects;

-- Allow anyone to upload (since we're using anon key without auth)
CREATE POLICY "Anyone can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow public read access
CREATE POLICY "Public can read profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update profile pictures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-pictures');

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete profile pictures"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-pictures');
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Game Flow

1. **Game Master** creates a game and sets number of rounds
2. **Players** join using the invite code
3. **Game Master** assigns imposter role and sets secret word + bonus hint
4. **Discussion Phase**: Players take turns (physically), can input clue words in app
5. **Game Master** controls spotlight to indicate whose turn it is
6. **Voting Phase**: All players vote for who they think is the imposter
7. **Imposter Guess**: If imposter survives, they can guess the secret word
8. **Results**: Points are calculated and displayed
9. **Next Round**: Repeat until all rounds complete
10. **Leaderboard**: Final scores displayed

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database, real-time, and storage
- **Supabase Realtime** - Real-time game state synchronization

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Hero/landing page
│   ├── games/             # Game selection and game pages
│   ├── login/             # User authentication
│   └── join/              # Join game flow
├── components/            # React components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client setup
│   └── game-logic.ts     # Game logic functions
└── types/                 # TypeScript type definitions
```

## Notes

- The database schema is already created via Supabase migrations
- Real-time subscriptions are enabled for games, rounds, votes, and player clues
- Profile pictures are stored in Supabase Storage bucket `profile-pictures`
- No authentication required - users are identified by username only

