'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Heart, Thermometer } from 'lucide-react';
import AuthTokenManager from '@/lib/auth-token';

export default function VitalSignsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [vitalSigns, setVitalSigns] = useState([]);
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
        <h1 className="text-2xl font-bold">Vital Signs Monitoring</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
              <Heart className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">72 BPM</div>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120/80</div>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.6°F</div>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}