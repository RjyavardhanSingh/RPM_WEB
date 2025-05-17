'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useRoleAccess, UserRole } from '@/lib/utils/user-utils';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackUrl?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackUrl = '/unauthorized' 
}: RoleGuardProps) {
  const router = useRouter();
  const { hasAccess, isLoading } = useRoleAccess(allowedRoles);
  
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.push(fallbackUrl);
    }
  }, [hasAccess, isLoading, router, fallbackUrl]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!hasAccess) {
    return null;
  }
  
  return <>{children}</>;
}