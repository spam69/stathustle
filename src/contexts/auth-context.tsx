"use client";

import type { User as AppUserType, Identity, SportInterest } from '@/types';
import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AppUserType | Identity | null; // Can be User or Identity
  originalUser: AppUserType | null; // Stores the base user if an identity is active
  login: (credentials: { emailOrUsername: string; password?: string }) => Promise<AppUserType | null>;
  logout: () => void;
  signup: (signupData: Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string; displayName?: string; profilePictureUrl?: string }) => Promise<AppUserType | null>;
  updateUserSettings: (settings: Partial<Pick<AppUserType, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl' | 'displayName'>>) => Promise<AppUserType | null>;
  switchToIdentity: (identity: Identity) => Promise<void>;
  switchToUser: () => Promise<void>;
  loading: boolean; // General loading state for context initialization
  isAuthActionLoading: boolean; // Specific for login/signup/update actions
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STATUSTLE_ACTIVE_PROFILE_KEY = 'stathustleActiveProfile';
const STATUSTLE_ORIGINAL_USER_KEY = 'stathustleOriginalUser';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUserType | Identity | null>(null);
  const [originalUser, setOriginalUser] = useState<AppUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    try {
      const storedActiveProfileJson = localStorage.getItem(STATUSTLE_ACTIVE_PROFILE_KEY);
      const storedOriginalUserJson = localStorage.getItem(STATUSTLE_ORIGINAL_USER_KEY);

      if (storedActiveProfileJson) {
        const storedActiveProfile = JSON.parse(storedActiveProfileJson) as AppUserType | Identity;
        setUser(storedActiveProfile);

        if (storedOriginalUserJson && storedActiveProfile.isIdentity) {
          const storedOriginalUser = JSON.parse(storedOriginalUserJson) as AppUserType;
          setOriginalUser(storedOriginalUser);
        } else {
          setOriginalUser(null);
        }
      } else {
        setUser(null);
        setOriginalUser(null);
      }
    } catch (e) {
      localStorage.removeItem(STATUSTLE_ACTIVE_PROFILE_KEY);
      localStorage.removeItem(STATUSTLE_ORIGINAL_USER_KEY);
      setUser(null);
      setOriginalUser(null);
      console.error("Error parsing user from localStorage", e);
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
      setOriginalUser(null); // Ensure original user is cleared on new login
      localStorage.setItem(STATUSTLE_ACTIVE_PROFILE_KEY, JSON.stringify(loggedInUser));
      localStorage.removeItem(STATUSTLE_ORIGINAL_USER_KEY); // Clear original user on new login
      return loggedInUser;
    } catch (error: any) {
      setUser(null);
      setOriginalUser(null);
      localStorage.removeItem(STATUSTLE_ACTIVE_PROFILE_KEY);
      localStorage.removeItem(STATUSTLE_ORIGINAL_USER_KEY);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setOriginalUser(null);
    localStorage.removeItem(STATUSTLE_ACTIVE_PROFILE_KEY);
    localStorage.removeItem(STATUSTLE_ORIGINAL_USER_KEY);
    queryClient.clear(); 
    router.push('/login'); 
  };

  const signupMutation = useMutation<AppUserType, Error, Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string; displayName?: string; profilePictureUrl?: string }>({
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

  const signup = async (signupData: Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string; displayName?: string; profilePictureUrl?: string }) => {
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
    onSuccess: (updatedBaseUser) => {
      // If an identity is active, update the originalUser state and localStorage
      if (originalUser) {
        setOriginalUser(updatedBaseUser);
        localStorage.setItem(STATUSTLE_ORIGINAL_USER_KEY, JSON.stringify(updatedBaseUser));
        // The active 'user' (the identity) remains unchanged by this
      } else {
        // If no identity is active, update the main 'user' state (which is the base user)
        setUser(updatedBaseUser);
        localStorage.setItem(STATUSTLE_ACTIVE_PROFILE_KEY, JSON.stringify(updatedBaseUser));
      }
      toast({ title: "Settings Updated", description: "Your profile settings have been saved." });
      queryClient.invalidateQueries({ queryKey: ['profile', updatedBaseUser.username] });
      if (updatedBaseUser.displayName) {
        queryClient.invalidateQueries({ queryKey: ['profile', updatedBaseUser.displayName] });
      }
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });


  const updateUserSettings = useCallback(async (settings: Partial<Pick<AppUserType, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl' | 'displayName'>>) => {
    const baseUserToUpdate = originalUser || (user && !user.isIdentity ? user as AppUserType : null);

    if (!baseUserToUpdate) {
      toast({ title: "Error", description: "Base user account not found for updating settings.", variant: "destructive" });
      return null;
    }
    try {
      const updatedUser = await updateSettingsMutation.mutateAsync({ ...settings, userId: baseUserToUpdate.id });
      return updatedUser;
    } catch (e) {
      return null;
    }
  }, [user, originalUser, updateSettingsMutation, toast]);


  const switchToIdentity = useCallback(async (identity: Identity) => {
    if (
      user &&
      !user.isIdentity &&
      (
        user.id === identity.owner.id ||
        (identity.teamMembers && identity.teamMembers.some(tm => tm.user.id === user.id))
      )
    ) {
      setOriginalUser(user as AppUserType);
      setUser(identity);
      localStorage.setItem(STATUSTLE_ACTIVE_PROFILE_KEY, JSON.stringify(identity));
      localStorage.setItem(STATUSTLE_ORIGINAL_USER_KEY, JSON.stringify(user));
      toast({ title: "Switched Profile", description: `Now acting as @${identity.username}` });
      router.push(`/profile/${identity.username}`); // Optional: redirect to identity profile
      router.refresh(); // Force refresh to ensure layout and data reflects new identity
    } else {
      toast({ title: "Switch Failed", description: "You can only switch to identities you own or are a team member of.", variant: "destructive" });
    }
  }, [user, toast, router]);

  const switchToUser = useCallback(async () => {
    if (originalUser) {
      const baseUsername = originalUser.username;
      setUser(originalUser);
      setOriginalUser(null);
      localStorage.setItem(STATUSTLE_ACTIVE_PROFILE_KEY, JSON.stringify(originalUser));
      localStorage.removeItem(STATUSTLE_ORIGINAL_USER_KEY);
      toast({ title: "Switched Profile", description: `Now acting as @${baseUsername}` });
      router.push(`/profile/${baseUsername}`); // Optional: redirect to user profile
      router.refresh();
    }
  }, [originalUser, toast, router]);


  const isAuthActionLoading = loginMutation.isPending || signupMutation.isPending || updateSettingsMutation.isPending;

  return (
    <AuthContext.Provider value={{
      user,
      originalUser,
      login,
      logout,
      signup,
      updateUserSettings,
      switchToIdentity,
      switchToUser,
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
