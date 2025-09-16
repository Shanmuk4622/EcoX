
'use client';

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';

export function UserAuthButton() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
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
          Welcome, {user.displayName?.split(' ')[0] || 'User'}
        </span>
        <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
      </div>
    );
  }

  return <Button onClick={handleSignIn} size="sm">Sign in with Google</Button>;
}
