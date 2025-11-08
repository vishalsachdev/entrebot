import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userService } from '../services/database';
import type { DbUser, UpdateUserForm } from '../types/database';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: DbUser) => void;
}

export default function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateUserForm>({
    name: '',
    phone_number: '',
    email: '',
  });

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await userService.getUser(userId);
      setUser(userData);
      setFormData({
        name: userData.name,
        phone_number: userData.phone_number,
        email: userData.email,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);
      const updatedUser = await userService.updateUser(userId, formData);
      setUser(updatedUser);
      setIsEditing(false);
      onUpdate?.(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-neutral-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Profile</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={loadUser}
            className="btn-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card">
        <p className="text-neutral-500 text-center py-8">No user profile found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">User Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-700 text-sm">{error}</p>
        </motion.div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="input"
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1"
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">
              Name
            </label>
            <p className="text-lg text-neutral-900">{user.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">
              Phone Number
            </label>
            <p className="text-lg text-neutral-900">{user.phone_number}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">
              Email
            </label>
            <p className="text-lg text-neutral-900">{user.email}</p>
          </div>

          <div className="pt-4 border-t border-neutral-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-neutral-500 mb-1">User ID</label>
                <p className="text-neutral-700 font-mono text-xs">{user.id}</p>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Created</label>
                <p className="text-neutral-700">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
