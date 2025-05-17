import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import AuthTokenManager from '@/lib/auth-token';

export function useApiAuth() {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  useEffect(() => {
    const syncToken = async () => {
      if (getToken) {
        const token = await getToken();
        if (token) {
          AuthTokenManager.setToken(token);
        }
      }
    };
    
    syncToken();
  }, [getToken, user]);
  
  return { user };
}