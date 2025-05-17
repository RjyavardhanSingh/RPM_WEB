'use client';

import { SignIn } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 p-4">
      <Card className="w-full max-w-md border-blue-100 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your patient monitoring dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn 
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
            redirectUrl="/dashboard"
          />
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <button 
            className="w-full flex items-center justify-center space-x-2 bg-slate-50 text-slate-800 p-3 rounded-md border border-gray-300 hover:bg-slate-100 transition-colors"
            onClick={() => window.location.href = '/api/auth/mobile-login'}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20V18H4V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Mobile App Login</span>
          </button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="text-primary underline-offset-4 hover:underline"
              suppressHydrationWarning
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-center text-muted-foreground">
            <a href="#" className="hover:underline text-primary">Privacy Policy</a> • <a href="#" className="hover:underline text-primary">Terms of Service</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}