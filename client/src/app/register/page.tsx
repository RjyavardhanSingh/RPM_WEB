'use client';

import { SignUp } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 p-4">
      <Card className="w-full max-w-md border-blue-100 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join our secure healthcare platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                formFieldInput: "input border-2",
                card: "shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footer: "hidden"
              },
            }}
            routing="hash"
            redirectUrl="/onboarding"
          />
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Web3 Registration</span>
            </div>
          </div>
          
          <button 
            className="w-full flex items-center justify-center space-x-2 bg-violet-50 text-violet-700 p-3 rounded-md border border-violet-200 hover:bg-violet-100 transition-colors"
            onClick={() => alert('Connect wallet functionality will be implemented here')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M16 12C16 13.1046 15.1046 14 14 14C12.8954 14 12 13.1046 12 12C12 10.8954 12.8954 10 14 10C15.1046 10 16 10.8954 16 12Z" fill="currentColor" />
            </svg>
            <span>Connect Wallet</span>
          </button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-primary underline-offset-4 hover:underline"
              suppressHydrationWarning
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our <a href="#" className="hover:underline text-primary">Terms</a> and <a href="#" className="hover:underline text-primary">Privacy Policy</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}