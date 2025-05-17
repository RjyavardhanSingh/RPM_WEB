'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Import auth utilities instead of the context
import { getMockUser } from '@/lib/auth-utils';
import { 
  LayoutGrid, Users, UserRound, Activity, Calendar, FileText, 
  Bell, Settings, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = getMockUser();
  const loading = false;
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const userRole = 'DOCTOR'; // Hard-coded for presentation
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['PATIENT', 'DOCTOR', 'ADMIN'] },
    { href: '/patients', label: 'Patients', icon: Users, roles: ['DOCTOR', 'ADMIN'] },
    { href: '/doctors', label: 'Doctors', icon: UserRound, roles: ['ADMIN'] },
    { href: '/vital-signs', label: 'Vital Signs', icon: Activity, roles: ['PATIENT', 'DOCTOR'] },
    { href: '/appointments', label: 'Appointments', icon: Calendar, roles: ['PATIENT', 'DOCTOR', 'ADMIN'] },
    { href: '/medical-records', label: 'Medical Records', icon: FileText, roles: ['PATIENT', 'DOCTOR'] },
    { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['PATIENT', 'DOCTOR', 'ADMIN'] },
    { href: '/settings', label: 'Settings', icon: Settings, roles: ['PATIENT', 'DOCTOR', 'ADMIN'] },
  ];
  
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <button 
        onClick={toggleSidebar}
        className="fixed z-50 bottom-4 right-4 p-3 rounded-full bg-primary text-white lg:hidden"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-primary">RPM System</span>
            </Link>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  pathname === item.href 
                    ? "bg-primary text-white" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {/* UserButton component */}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {filteredNavItems.find(item => item.href === pathname)?.label || 'Dashboard'}
            </h1>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}