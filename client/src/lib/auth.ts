'use client';

import { useState, useEffect, createContext, useContext } from "react";

// Define and export the auth context type
export interface AuthContextType {
  user: any | null;
  loading: boolean;
  getToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  getToken: async () => null,
  signIn: async () => {},
  signOut: async () => {},
});

// Provider component that wraps the app and provides auth context
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock token for development
  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkRPQ1RPUiIsImlhdCI6MTUxNjIzOTAyMn0.xYaUCkUOe5V2vEFbgegy4XNLzMwWN9AdeMFMOQGqwK0";

  useEffect(() => {
    // Check if user is stored in localStorage
    try {
      const storedUser = localStorage?.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      // Handle localStorage not being available (SSR)
      console.error("localStorage not available:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to get the auth token
  const getToken = async (): Promise<string | null> => {
    return mockToken;
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const mockUser = { id: '123', name: 'User', email, role: 'PATIENT' };
      setUser(mockUser);
      try {
        localStorage?.setItem('user', JSON.stringify(mockUser));
      } catch (error) {
        console.error("Could not store user in localStorage:", error);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    setUser(null);
    try {
      localStorage?.removeItem('user');
    } catch (error) {
      console.error("Could not remove user from localStorage:", error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    getToken,
    signIn,
    signOut,
  };

  return null
}

// Custom hook that simplifies access to the auth context
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}