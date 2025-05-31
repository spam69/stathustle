
"use client";

import type { User, SportInterest } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (credentials: Pick<User, 'email'> & { password: string }) => Promise<User | null>;
  logout: () => void;
  signup: (signupData: Omit<User, 'id' | 'themePreference' | 'isIdentity'> & { password: string }) => Promise<User | null>;
  updateUserSettings: (settings: Partial<Pick<User, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => Promise<User | null>;
  loading: boolean; // For initial session load
  isAuthActionLoading: boolean; // For login/signup/update actions
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loginUser(credentials: Pick<User, 'email'> & { password: string }): Promise<User> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }
  return response.json();
}

async function signupUser(signupData: Omit<User, 'id' | 'themePreference' | 'isIdentity'> & { password: string }): Promise<User> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Signup failed');
  }
  return response.json();
}

async function updateUserData(userId: string, settings: Partial<User>): Promise<User> {
  const response = await fetch(`/api/user/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...settings }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update settings');
  }
  return response.json();
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // For initial local storage check
  const { toast } = useToast();
  const queryClient = useQueryClient();


  useEffect(() => {
    const storedUser = localStorage.getItem('stathustle-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('stathustle-user');
      }
    }
    setLoading(false);
  }, []);

  const loginMutation = useMutation<User, Error, Pick<User, 'email'> & { password: string }>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem('stathustle-user', JSON.stringify(data));
      toast({ title: "Login Successful", description: `Welcome back, ${data.username}!` });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] }); // Invalidate any user-specific queries
      queryClient.invalidateQueries({ queryKey: ['posts'] }); // Posts might differ based on user
    },
    onError: (error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  const signupMutation = useMutation<User, Error, Omit<User, 'id' | 'themePreference' | 'isIdentity'> & { password: string }>({
    mutationFn: signupUser,
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem('stathustle-user', JSON.stringify(data));
      toast({ title: "Signup Successful", description: "Welcome to StatHustle!" });
    },
    onError: (error) => {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    },
  });
  
  const updateSettingsMutation = useMutation<User, Error, Partial<User>>({
    mutationFn: (settings) => {
      if (!user) throw new Error("User not logged in");
      return updateUserData(user.id, settings);
    },
    onSuccess: (data) => {
      setUser(data); // Update context user
      localStorage.setItem('stathustle-user', JSON.stringify(data)); // Update local storage
      toast({ title: "Settings Updated", description: "Your profile information has been saved." });
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] });
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });


  const login = async (credentials: Pick<User, 'email'> & { password: string }) => {
    try {
      const loggedInUser = await loginMutation.mutateAsync(credentials);
      return loggedInUser;
    } catch (error) {
      return null;
    }
  };

  const signup = async (signupData: Omit<User, 'id' | 'themePreference' | 'isIdentity'> & { password: string }) => {
     try {
      const signedUpUser = await signupMutation.mutateAsync(signupData);
      return signedUpUser;
    } catch (error) {
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stathustle-user');
    queryClient.clear(); // Clear all query cache on logout
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
  };
  
  const updateUserSettings = useCallback(async (settings: Partial<Pick<User, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to update settings.", variant: "destructive"});
      return null;
    }
    try {
      const updatedUser = await updateSettingsMutation.mutateAsync(settings);
      // Also update theme via next-themes if themePreference is changed
      if (settings.themePreference) {
        // The ThemeSwitcher component handles calling setTheme from next-themes
        // We just ensure the user object has the correct preference for persistence
      }
      return updatedUser;
    } catch(e) {
      // Error already handled by useMutation's onError
      return null;
    }
  }, [user, updateSettingsMutation, toast]);

  const isAuthActionLoading = loginMutation.isPending || signupMutation.isPending || updateSettingsMutation.isPending;

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, updateUserSettings, loading, isAuthActionLoading }}>
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

    