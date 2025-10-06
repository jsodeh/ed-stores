import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profiles } from '@/lib/supabase';

export function UserDebug() {
  const { user, profile, isAdmin } = useAuth();
  const [emailProfile, setEmailProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmailProfile = async () => {
      if (user?.email) {
        setLoading(true);
        try {
          const result = await profiles.getProfileByEmail(user.email);
          setEmailProfile(result.data);
        } catch (error) {
          console.error('Error fetching email profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEmailProfile();
  }, [user?.email]);

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-yellow-800">User Debug Info</h3>
        <p className="text-yellow-700">Not signed in</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-bold text-blue-800 mb-2">User Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">User ID:</span> {user.id}
        </div>
        <div>
          <span className="font-medium">Email:</span> {user.email}
        </div>
        <div>
          <span className="font-medium">Is Authenticated:</span> {user ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-medium">Profile Loaded:</span> {profile ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-medium">Is Admin:</span> {isAdmin ? 'Yes' : 'No'}
        </div>
        
        {profile && (
          <div className="mt-2 p-2 bg-white rounded border">
            <h4 className="font-medium text-gray-800">Profile Data:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}
        
        {emailProfile && (
          <div className="mt-2 p-2 bg-white rounded border">
            <h4 className="font-medium text-gray-800">Email Profile Data:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(emailProfile, null, 2)}
            </pre>
          </div>
        )}
        
        {loading && (
          <div className="text-blue-600">Loading profile data...</div>
        )}
      </div>
    </div>
  );
}