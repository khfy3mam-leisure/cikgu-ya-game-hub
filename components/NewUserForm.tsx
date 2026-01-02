'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProfilePictureUpload from './ProfilePictureUpload';

interface NewUserFormProps {
  onSuccess: (userId: string) => void;
  onBack: () => void;
}

export default function NewUserForm({ onSuccess, onBack }: NewUserFormProps) {
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({ username: username.trim() })
        .select()
        .single();

      if (userError) {
        if (userError.code === '23505') { // Unique constraint violation
          setError('Username already exists. Please choose another or select existing user.');
        } else {
          setError('Failed to create user. Please try again.');
        }
        setLoading(false);
        return;
      }

      let profilePictureUrl = null;

      // Upload profile picture if provided
      if (profilePicture && userData) {
        try {
          const fileExt = profilePicture.name.split('.').pop();
          const fileName = `${userData.id}-${Date.now()}.${fileExt}`;
          const filePath = `profile-pictures/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(filePath, profilePicture, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            // Don't fail the whole registration if upload fails
            // Just continue without profile picture
            setError(`Profile picture upload failed: ${uploadError.message}. User created without profile picture.`);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('profile-pictures')
              .getPublicUrl(filePath);
            
            profilePictureUrl = publicUrl;

            // Update user with profile picture URL
            const { error: updateError } = await supabase
              .from('users')
              .update({ profile_picture_url: profilePictureUrl })
              .eq('id', userData.id);

            if (updateError) {
              console.error('Error updating user with profile picture:', updateError);
            }
          }
        } catch (uploadErr) {
          console.error('Error uploading profile picture:', uploadErr);
          // Continue without profile picture
        }
      }

      onSuccess(userData.id);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Create New User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture (Optional)
            </label>
            <ProfilePictureUpload
              onFileSelect={setProfilePicture}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}

