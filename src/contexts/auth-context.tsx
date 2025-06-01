
"use client";

import type { User as AppUserType, SportInterest } from '@/types';
import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { mockUsers, mockAdminUser } from '@/lib/mock-data';
import { useRouter } from 'next/navigation'; // Import for redirects

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

async function updateUserDataInMock(userId: string, settings: Partial<AppUserType>): Promise<AppUserType> {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found in mock data for update');
  }
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...settings };
  const { password, ...updatedUserNoPassword } = mockUsers[userIndex];
  return updatedUserNoPassword as AppUserType;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUserType | null>(null);
  const [loading, setLoading] = useState(true); // For initial user check
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Simulate checking for a logged-in user on mount (e.g., from localStorage or a persistent mock)
  useEffect(() => {
    // For this simple mock, we can set the admin user as default or check localStorage
    // For now, let's start with no user logged in unless we implement a persistent mock.
    // To simulate admin always logged in for dev:
    // setUser(mockAdminUser as AppUserType); 
    setLoading(false);
  }, []);

  const login = async (credentials: { emailOrUsername: string; password?: string }): Promise<AppUserType | null> => {
    setLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = mockUsers.find(
      u => (u.email.toLowerCase() === credentials.emailOrUsername.toLowerCase() ||
            u.username.toLowerCase() === credentials.emailOrUsername.toLowerCase()) &&
           u.password === credentials.password // Simple password check for mock
    );

    if (foundUser) {
      const { password, ...userToSet } = foundUser;
      setUser(userToSet as AppUserType);
      setLoading(false);
      return userToSet as AppUserType;
    } else {
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    queryClient.clear(); // Clear react-query cache on logout
    router.push('/login'); // Redirect to login page
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
      // Optionally, you could auto-login the user here by calling login()
      // For now, redirect to login page
      router.push('/login');
      return signedUpUser;
    } catch (error: any) {
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
      return null;
    }
  };

  const updateSettingsMutation = useMutation<AppUserType, Error, Partial<AppUserType> & { userId: string }>({
    mutationFn: (settingsWithId) => {
       const { userId, ...settings } = settingsWithId;
       // In a real app, this would be an API call. For mock, we update mockUsers directly.
       return updateUserDataInMock(userId, settings);
    },
    onSuccess: (data) => {
      setUser(data); // Update user in context
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
      return null;
    }
  }, [user, updateSettingsMutation, toast, queryClient]);

  const isAuthActionLoading = signupMutation.isPending || updateSettingsMutation.isPending;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      signup,
      updateUserSettings,
      loading, // General loading for context initialization
      isAuthActionLoading, // Specific for form submissions
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
