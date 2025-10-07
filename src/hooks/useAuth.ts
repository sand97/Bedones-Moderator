import { useState, useEffect } from 'react';
import { signIn, signOut as authSignOut, useSession } from '~/lib/auth-client';

export function useAuth() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(() => {
    // Check if OAuth is in progress from sessionStorage (only on client-side)
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('facebookOAuthInProgress') === 'true';
  });

  useEffect(() => {
    // Clear the OAuth in progress flag on mount (in case of error/cancellation)
    const clearFlag = () => {
      sessionStorage.removeItem('facebookOAuthInProgress');
    };

    // Clear on visibility change (user comes back to tab)
    document.addEventListener('visibilitychange', clearFlag);

    return () => {
      document.removeEventListener('visibilitychange', clearFlag);
    };
  }, []);

  const handleSignIn = () => {
    setLoading(true);
    // Set flag in sessionStorage to persist loading state across remounts
    sessionStorage.setItem('facebookOAuthInProgress', 'true');

    // Use custom auth client to initiate Facebook OAuth
    signIn();
  };

  const handleSignOut = async () => {
    await authSignOut();
  };

  return {
    session,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}
