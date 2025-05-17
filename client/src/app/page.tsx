'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Secure Remote Patient Monitoring
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Real-time health monitoring with blockchain-verified medical records. 
                    Keep your patients connected and your data secure.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                      Register Now
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/health-monitoring.svg" 
                  alt="Remote Patient Monitoring"
                  className="rounded-xl object-cover object-center"
                  style={{ width: '100%', height: 'auto' }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/500x400?text=Remote+Patient+Monitoring';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Key Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our platform provides comprehensive tools to monitor patient health remotely with maximum security
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <Shield className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Secure File Storage</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Medical files stored with blockchain verification and decentralized storage to prevent unauthorized access
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <Activity className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Real-time Monitoring</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Track vital signs in real-time with automatic alerts for abnormal readings
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <FileText className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Medical Records</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Comprehensive medical history with secure doctor-patient sharing capabilities
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 Remote Patient Monitoring. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link 
            className="text-xs hover:underline underline-offset-4" 
            href="/terms"
            suppressHydrationWarning
          >
            Terms of Service
          </Link>
          <Link 
            className="text-xs hover:underline underline-offset-4" 
            href="/privacy"
            suppressHydrationWarning
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
