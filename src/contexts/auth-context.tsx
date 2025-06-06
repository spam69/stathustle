
"use client";

import type { User as AppUserType, SportInterest } from '@/types';
import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
// mockUsers and mockAdminUser are no longer primary sources for login/signup
// import { mockUsers, mockAdminUser } from '@/lib/mock-data'; 
import { useRouter } from 'next/navigation';

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

// Mock function removed, actual API calls will be made for settings.
// async function updateUserDataInMock(userId: string, settings: Partial<AppUserType>): Promise<AppUserType> { ... }

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUserType | null>(null);
  const [loading, setLoading] = useState(true); // For initial user check from session/local storage
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a persisted session (e.g., from localStorage)
    // For now, this simple example doesn't persist session across reloads.
    // A real app would check a token or localStorage here.
    // To persist user state for demo, you could use localStorage:
    const storedUser = localStorage.getItem('stathustleUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('stathustleUser');
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
      localStorage.setItem('stathustleUser', JSON.stringify(loggedInUser)); // Persist user
      return loggedInUser;
    } catch (error: any) {
      setUser(null);
      localStorage.removeItem('stathustleUser'); // Clear persisted user on error
      // Toast is handled by the page component to show "Invalid email/username or password"
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stathustleUser'); // Clear persisted user
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
        // This API route doesn't exist yet in the migration to Mongoose.
        // Placeholder for API call for user settings update
        // For now, this will simulate local update and show success
        // throw new Error("User settings update API endpoint not yet migrated to Mongoose.");
        console.warn("User settings update API endpoint not yet migrated to Mongoose. Simulating local update.");
        if (!user || user.id !== settingsWithId.userId) throw new Error("User mismatch or not logged in.");
        const updatedLocalUser = { ...user, ...settingsWithId };
        // Simulating a successful API response:
        await new Promise(resolve => setTimeout(resolve, 300)); 
        return updatedLocalUser as AppUserType;
    },
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem('stathustleUser', JSON.stringify(data)); // Update persisted user
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
      // Note: The API for user settings update (/api/user/settings) still needs to be migrated to Mongoose.
      // The mutationFn in updateSettingsMutation will need to call a Mongoose-backed API.
      const updatedUser = await updateSettingsMutation.mutateAsync({ ...settings, userId: user.id });
      return updatedUser;
    } catch (e) {
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
