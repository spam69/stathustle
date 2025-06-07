
"use client";

import type { User as AppUserType, SportInterest } from '@/types';
import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import jwtDecode from 'jwt-decode'; // Import jwt-decode

interface DecodedToken {
  id: string;
  username: string;
  exp: number; // Expiration time (timestamp)
  iat: number; // Issued at time (timestamp)
}

interface AuthContextType {
  user: AppUserType | null;
  login: (credentials: { emailOrUsername: string; password?: string }) => Promise<AppUserType | null>;
  logout: () => void;
  signup: (signupData: Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string }) => Promise<AppUserType | null>;
  updateUserSettings: (settings: Partial<Pick<AppUserType, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => Promise<AppUserType | null>;
  loading: boolean; // General loading state for context initialization
  isAuthActionLoading: boolean; // Specific for login/signup/update actions
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const storedUserJson = localStorage.getItem('stathustleUser');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson) as AppUserType;
        // For non-JWT setup, we trust the stored user.
        // If JWT was used, we'd validate token expiry here.
        // const token = localStorage.getItem('stathustleToken');
        // if (token) {
        //   const decodedToken = jwtDecode<DecodedToken>(token);
        //   if (decodedToken.exp * 1000 < Date.now()) { // Check if token is expired
        //     localStorage.removeItem('stathustleUser');
        //     localStorage.removeItem('stathustleToken');
        //     setUser(null);
        //   } else if (decodedToken.id === storedUser.id) { // Basic check
        //     setUser(storedUser);
        //   } else { // Mismatch or other issue
        //     localStorage.removeItem('stathustleUser');
        //     localStorage.removeItem('stathustleToken');
        //     setUser(null);
        //   }
        // } else { // No token, but user data exists - clear it
        //   localStorage.removeItem('stathustleUser');
        //   setUser(null);
        // }
        setUser(storedUser); // Directly set user for non-JWT setup
      } catch (e) {
        localStorage.removeItem('stathustleUser');
        // localStorage.removeItem('stathustleToken');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const loginMutation = useMutation<AppUserType, Error, { emailOrUsername: string; password?: string }>({
    mutationFn: async (credentials) => {
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
    },
  });

  const login = async (credentials: { emailOrUsername: string; password?: string }): Promise<AppUserType | null> => {
    try {
      const loggedInUser = await loginMutation.mutateAsync(credentials);
      setUser(loggedInUser);
      localStorage.setItem('stathustleUser', JSON.stringify(loggedInUser));
      // No token to store in non-JWT setup
      return loggedInUser;
    } catch (error: any) {
      setUser(null);
      localStorage.removeItem('stathustleUser');
      // localStorage.removeItem('stathustleToken');
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stathustleUser');
    // localStorage.removeItem('stathustleToken');
    queryClient.clear(); 
    router.push('/login'); 
  };

  const signupMutation = useMutation<AppUserType, Error, Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string }>({
    mutationFn: async (signupData) => {
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
    },
  });

  const signup = async (signupData: Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string }) => {
    try {
      const signedUpUser = await signupMutation.mutateAsync(signupData);
      toast({
        title: "Account Created!",
        description: "You can now log in with your new credentials.",
      });
      router.push('/login');
      return signedUpUser;
    } catch (error: any) {
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
      return null;
    }
  };
  
  const updateSettingsMutation = useMutation<AppUserType, Error, Partial<AppUserType> & { userId: string }>({
    mutationFn: async (settingsWithId) => {
        const response = await fetch('/api/user/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsWithId),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update settings');
          }
          return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem('stathustleUser', JSON.stringify(data)); 
      toast({ title: "Settings Updated", description: "Your profile settings have been saved." });
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] });
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });


  const updateUserSettings = useCallback(async (settings: Partial<Pick<AppUserType, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to update settings.", variant: "destructive" });
      return null;
    }
    try {
      const updatedUser = await updateSettingsMutation.mutateAsync({ ...settings, userId: user.id });
      return updatedUser;
    } catch (e) {
      // Error is handled by mutation's onError
      return null;
    }
  }, [user, updateSettingsMutation, toast, queryClient]);

  const isAuthActionLoading = loginMutation.isPending || signupMutation.isPending || updateSettingsMutation.isPending;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      signup,
      updateUserSettings,
      loading, 
      isAuthActionLoading, 
    }}>
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
