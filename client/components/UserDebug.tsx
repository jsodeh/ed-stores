import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profiles } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function UserDebug() {
  const { user, profile, isAdmin, loading, loadUserProfile } = useAuth();
  const [emailProfile, setEmailProfile] = useState<any>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    console.log('UserDebug: Auth state changed', { user, profile, isAdmin, loading });
  }, [user, profile, isAdmin, loading]);

  const handleRefetchProfile = () => {
    if (user) {
      loadUserProfile(user.id);
    }
  };

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
        
        {loading && (
          <div className="text-blue-600">Loading profile data...</div>
        )}

        <Button onClick={handleRefetchProfile} disabled={loading} size="sm" variant="outline" className="mt-2">
          Refetch Profile
        </Button>
      </div>
    </div>
  );
}