'use client';

import { useEffect, useRef } from 'react';
import { useSession } from '~/lib/auth-client';
import { identifyUser, clearUser } from '~/lib/analytics';

/**
 * Component that automatically identifies/de-identifies users in Google Analytics
 * based on their session state
 */
export function AnalyticsIdentifier() {
  const { data: sessionData } = useSession();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = sessionData?.user?.id || null;

    // If user changed (login, logout, or switched accounts)
    if (currentUserId !== previousUserIdRef.current) {
      if (currentUserId) {
        // User logged in or switched account
        identifyUser(currentUserId);
      } else {
        // User logged out
        clearUser();
      }

      previousUserIdRef.current = currentUserId;
    }
  }, [sessionData]);

  return null;
}
