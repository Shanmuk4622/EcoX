
'use client';

import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';

export function UserAuthButton() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (loading) {
    return <Button variant="outline" size="sm">Loading...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Welcome, {user.user_metadata.full_name?.split(' ')[0] || user.email}
        </span>
        <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
      </div>
    );
  }

  return <Button onClick={handleSignIn} size="sm">Sign in with Google</Button>;
}
