
"use client";

import type { User, SportInterest } from '@/types';
import { mockUser1 } from '@/lib/mock-data';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  signup: (userData: Omit<User, 'id' | 'themePreference'>) => void;
  updateUserInterests: (interests: SportInterest[]) => void;
  updateThemePreference: (theme: 'light' | 'dark' | 'pink' | 'blue') => void; // Pink & blue are future
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for an existing session
    const storedUser = localStorage.getItem('stathustle-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    const userWithDefaults = { ...mockUser1, ...userData }; // Merge with mock to ensure all fields
    setUser(userWithDefaults);
    localStorage.setItem('stathustle-user', JSON.stringify(userWithDefaults));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stathustle-user');
  };

  const signup = (userData: Omit<User, 'id' | 'themePreference'>) => {
    const newUser: User = {
      id: `user-${Date.now()}`, // Simple unique ID
      ...userData,
      themePreference: 'light', // Default theme
      profilePictureUrl: userData.profilePictureUrl || 'https://placehold.co/200x200.png',
      bannerImageUrl: userData.bannerImageUrl || 'https://placehold.co/1200x300.png',
    };
    setUser(newUser);
    localStorage.setItem('stathustle-user', JSON.stringify(newUser));
  };

  const updateUserInterests = (interests: SportInterest[]) => {
    if (user) {
      const updatedUser = { ...user, sportInterests: interests };
      setUser(updatedUser);
      localStorage.setItem('stathustle-user', JSON.stringify(updatedUser));
    }
  };
  
  const updateThemePreference = (theme: 'light' | 'dark' | 'pink' | 'blue') => {
    if (user) {
      const updatedUser = { ...user, themePreference: theme };
      setUser(updatedUser);
      localStorage.setItem('stathustle-user', JSON.stringify(updatedUser));
      // Actual theme switching logic (e.g., adding/removing class from html) would go here
      // or be handled by a ThemeProvider.
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, signup, updateUserInterests, updateThemePreference, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

