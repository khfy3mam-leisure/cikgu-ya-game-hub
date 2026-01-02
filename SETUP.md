# Setup Guide for Cikgu Ya Game Hub

## Quick Start

### 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zvggvztlfbyqjhsxmjxj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**To get your anon key:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "anon public" key

### 2. Supabase Storage Setup

The database schema is already created. You just need to set up the storage bucket:

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Name it: `profile-pictures`
5. Make it **Public** (toggle on)
6. Set **max file size** to **10MB** (this limits each individual file upload)
7. Click **Create bucket**

**Note:** 
- **Individual file limit**: 10MB per image (set in bucket settings and enforced in app code)
- **Total bucket capacity**: 250MB total storage for all files combined (limited by your Supabase plan's storage quota)
- The app code validates individual uploads to 10MB, and your Supabase plan determines the total storage available

Then add these storage policies in the SQL Editor (this will drop existing policies first):

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

### 3. Run the App

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Testing the App

1. **Create a user**: Go to `/login`, select "New User", enter a username
2. **Create a game**: Go to `/games`, select "Word Imposter", create a game
3. **Join as player**: Use the invite code on another device/browser
4. **Play**: Follow the game flow as Game Master

## Deployment to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

The app will be live at your Vercel URL.

