'use client';

import { useState, useEffect } from 'react';
import { useUser,useAuth } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AuthTokenManager from '@/lib/auth-token';

export default function SettingsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const userRole = user?.unsafeMetadata?.role as string || 'PATIENT';
  
  useEffect(() => {
    // Update token on component mount
    const syncToken = async () => {
      if (getToken) {
        const token = await getToken();
        if (token) {
          AuthTokenManager.setToken(token);
        }
      }
    };
    
    syncToken();
    
    // Fetch data logic would go here
    setLoading(false);
  }, [user]);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Your full name"
                defaultValue={user?.fullName || ''}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Email Address</label>
              <input
                type="email"
                className="w-full p-2 border rounded-md"
                placeholder="Your email address"
                defaultValue={user?.primaryEmailAddress?.emailAddress || ''}
                disabled
              />
              <p className="text-xs text-gray-500">Email changes are managed through your account settings</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Role</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={userRole}
                disabled
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      )}
    </DashboardLayout>
  );
}