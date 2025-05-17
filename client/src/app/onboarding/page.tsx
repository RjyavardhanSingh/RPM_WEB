'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRound, Users, Shield } from 'lucide-react';

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleRoleSelection = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // First, we'll create a div for the captcha
      const captchaDiv = document.createElement('div');
      captchaDiv.id = 'clerk-captcha';
      captchaDiv.style.position = 'absolute';
      captchaDiv.style.left = '-9999px'; // Position off-screen
      document.body.appendChild(captchaDiv);
      
      // Now update the metadata with the correct property name
      await user?.update({
        unsafeMetadata: {
          role: selectedRole,
        },
      });
      
      setSuccess("Role updated successfully!");
      
      // Clean up the captcha div
      document.body.removeChild(captchaDiv);
      
      // Wait a moment before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('Error setting user role:', error);
      setError("There was a problem setting your role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to RPM System</CardTitle>
            <CardDescription>
              Please select your role to complete your account setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded-md">
                {success}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRole === 'PATIENT' 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedRole('PATIENT')}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UserRound size={24} />
                  </div>
                  <h3 className="font-medium">Patient</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Access your health records, track vitals, and schedule appointments
                  </p>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRole === 'DOCTOR' 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedRole('DOCTOR')}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Users size={24} />
                  </div>
                  <h3 className="font-medium">Doctor</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage patients, monitor vital signs, and update medical records
                  </p>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRole === 'ADMIN' 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedRole('ADMIN')}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Shield size={24} />
                  </div>
                  <h3 className="font-medium">Admin</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage users, system settings, and monitor platform activity
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={handleRoleSelection} 
              disabled={!selectedRole || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Setting up your account...' : 'Continue'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}