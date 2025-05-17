import { useUser } from '@clerk/nextjs';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'USER';

export function useUserRole(): { role: UserRole; isLoading: boolean } {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return { role: 'USER', isLoading: true };
  }
  
  const role = (user?.publicMetadata?.role as UserRole) || 'PATIENT';
  return { role, isLoading: false };
}

export function useRoleAccess(allowedRoles: UserRole[]): { 
  hasAccess: boolean; 
  isLoading: boolean;
} {
  const { role, isLoading } = useUserRole();
  
  if (isLoading) {
    return { hasAccess: false, isLoading: true };
  }
  
  return { 
    hasAccess: allowedRoles.includes(role),
    isLoading: false 
  };
}