import { Header } from "@/components/Header";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function UserDebugPage() {
  const { user, profile, isAdmin, checkUserByEmail } = useAuth();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugCheck = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // Check user by email
      const emailCheck = await checkUserByEmail(user.email);
      
      // Also check directly with Supabase
      const { data: profileDirect, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', user.email)
        .single();
      
      setDebugInfo({
        emailCheck,
        profileDirect,
        profileError
      });
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runDebugCheck();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavigation />
      <div className="md:hidden">
        <Header />
      </div>
      
      <main className="max-w-4xl mx-auto p-4 pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            ←
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">User Debug</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Authentication Status</h3>
                  <p>User ID: {user.id}</p>
                  <p>Email: {user.email}</p>
                  <p className={isAdmin ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    Is Admin: {isAdmin ? 'Yes' : 'No'}
                  </p>
                </div>

                {profile && (
                  <div>
                    <h3 className="font-medium">Profile Data</h3>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(profile, null, 2)}
                    </pre>
                  </div>
                )}

                {debugInfo && (
                  <div>
                    <h3 className="font-medium">Debug Results</h3>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                )}

                <Button 
                  onClick={runDebugCheck}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Checking...' : 'Run Debug Check'}
                </Button>
              </div>
            ) : (
              <div>
                <p>You are not signed in.</p>
                <Button onClick={() => navigate("/")}>Go to Home</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}