import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, Session } from './auth';

export interface SessionData {
  session: Session;
  user: User;
}

/**
 * Fetch current session from API
 */
async function fetchSession(): Promise<SessionData | null> {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

/**
 * Sign out the current user
 */
async function signOutRequest(): Promise<void> {
  await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include',
  });
}

/**
 * React hook to get current session
 */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

/**
 * Initiate Facebook sign-in
 */
export function signIn() {
  window.location.href = '/api/auth/signin/facebook';
}

/**
 * Initiate Instagram sign-in
 */
export function signInWithInstagram() {
  window.location.href = '/api/auth/signin/instagram';
}

/**
 * Sign out the current user
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOutRequest,
    onSuccess: () => {
      queryClient.setQueryData(['session'], null);
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

/**
 * Legacy signOut function for compatibility
 */
export async function signOut() {
  await signOutRequest();
  window.location.href = '/';
}
