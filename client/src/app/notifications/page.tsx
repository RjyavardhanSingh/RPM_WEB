'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertCircle } from 'lucide-react';
import AuthTokenManager from '@/lib/auth-token';

export default function NotificationsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <p>No notifications found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}