'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/game';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import PlayerAvatar from '@/components/PlayerAvatar';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfilePicture = async () => {
    if (!profilePicture || !user) {
      setError('Please select a new profile picture');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Delete old profile picture if exists
      if (user.profile_picture_url) {
        try {
          const oldPath = user.profile_picture_url.split('/profile-pictures/')[1];
          if (oldPath) {
            await supabase.storage
              .from('profile-pictures')
              .remove([`profile-pictures/${oldPath}`]);
          }
        } catch (err) {
          // Ignore errors when deleting old picture
          console.log('Could not delete old picture:', err);
        }
      }

      // Upload new profile picture
      const fileExt = profilePicture.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, profilePicture, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update user with new profile picture URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Reload user data
      await loadUser();
      setProfilePicture(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile picture:', err);
      setError(err.message || 'Failed to update profile picture');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Link href="/games" className="text-white/70 hover:text-white text-sm mb-6 inline-block">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Your Profile
          </h1>

          <div className="space-y-6">
            {/* Current Profile Picture */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Current Profile Picture
              </label>
              <div className="flex justify-center">
                <PlayerAvatar user={user} size={120} />
              </div>
              <p className="text-sm text-gray-500 mt-2">{user.username}</p>
            </div>

            {/* Upload New Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Profile Picture
              </label>
              <ProfilePictureUpload
                onFileSelect={setProfilePicture}
                disabled={saving}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                Profile picture updated successfully! ✨
              </div>
            )}

            <button
              onClick={handleUpdateProfilePicture}
              disabled={saving || !profilePicture}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Updating...' : 'Update Profile Picture'}
            </button>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/games"
                className="block w-full text-center bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Back to Games
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

