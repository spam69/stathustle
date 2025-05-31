
"use client";

import type { User as AppUser, SportInterest } from '@/types'; // Renamed to AppUser to avoid conflict with NextAuth.User
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { signIn, signOut, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

interface AuthContextType {
  user: (AppUser & { id: string; username: string }) | null; // Adjusted user type
  login: (credentials: { emailOrUsername: string; password: string }) => Promise<boolean>; // Returns boolean for success
  logout: () => void;
  signup: (signupData: Omit<AppUser, 'id' | 'themePreference' | 'isIdentity'> & { password: string }) => Promise<AppUser | null>;
  updateUserSettings: (settings: Partial<Pick<AppUser, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => Promise<AppUser | null>;
  loading: boolean; // For initial session load from NextAuth
  isAuthActionLoading: boolean; // For signup/update actions (login handled by NextAuth directly)
  session: Session | null; // Expose the raw NextAuth session if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Keep signup and update user data functions as they interact with custom APIs
async function signupUser(signupData: Omit<AppUser, 'id' | 'themePreference' | 'isIdentity'> & { password: string }): Promise<AppUser> {
  const response = await fetch('/api/auth/signup', { // This API route should remain
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

async function updateUserData(userId: string, settings: Partial<AppUser>): Promise<AppUser> {
  const response = await fetch(`/api/user/settings`, { // This API route should remain
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
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loading = status === 'loading';
  
  // Map NextAuth session user to our AppUser type
  // Ensure all necessary fields from your AppUser are present in the NextAuth User/Session types (via next-auth.d.ts)
  const appUserFromSession = session?.user ? {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email ?? '', // Provide default if potentially null
    // Map other fields if they exist on session.user and are needed for AppUser
    profilePictureUrl: session.user.image ?? undefined, 
    // bannerImageUrl, socialLinks, sportInterests, themePreference, bio typically not on NextAuth's default session.user
    // These would need to be fetched separately or added via JWT/session callbacks if critical for AuthContext.user
    // For now, we'll assume they are fetched on profile pages etc.
  } as (AppUser & { id: string; username: string }) : null;


  const login = async (credentials: {emailOrUsername: string; password: string}) => {
    const result = await signIn('credentials', {
      redirect: false, // Handle redirect manually or based on result
      emailOrUsername: credentials.emailOrUsername,
      password: credentials.password,
    });

    if (result?.error) {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
      return false;
    }
    if (result?.ok) {
      toast({ title: "Login Successful", description: `Welcome back!`});
      // queryClient.invalidateQueries({ queryKey: ['posts'] }); // Invalidate queries that depend on auth state
      return true;
    }
    return false;
  };

  const logout = () => {
    signOut({ callbackUrl: '/login' }); // Redirect to login after signout
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
    queryClient.clear();
  };

  // Signup mutation remains, as it calls our custom API
  const signupMutation = useMutation<AppUser, Error, Omit<AppUser, 'id' | 'themePreference' | 'isIdentity'> & { password: string }>({
    mutationFn: signupUser,
    onSuccess: (data) => {
      toast({ title: "Signup Successful", description: "Please log in with your new account." });
      // Optionally, automatically sign in the user here, or redirect to login
    },
    onError: (error) => {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    },
  });

  const signup = async (signupData: Omit<AppUser, 'id' | 'themePreference' | 'isIdentity'> & { password: string }) => {
    try {
     const signedUpUser = await signupMutation.mutateAsync(signupData);
     return signedUpUser;
   } catch (error) {
     return null;
   }
 };
  
  // Update settings mutation remains
  const updateSettingsMutation = useMutation<AppUser, Error, Partial<AppUser>>({
    mutationFn: (settings) => {
      if (!appUserFromSession) throw new Error("User not logged in");
      return updateUserData(appUserFromSession.id, settings);
    },
    onSuccess: (data) => {
      toast({ title: "Settings Updated", description: "Your profile information has been saved." });
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] });
      // If themePreference changes, next-themes should pick it up if it's stored in session and used by ThemeSwitcher
      // For now, AuthContext doesn't directly manage themePreference from session for theme switching
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateUserSettings = useCallback(async (settings: Partial<Pick<AppUser, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => {
    if (!appUserFromSession) {
      toast({ title: "Error", description: "You must be logged in to update settings.", variant: "destructive"});
      return null;
    }
    try {
      const updatedUser = await updateSettingsMutation.mutateAsync(settings);
      return updatedUser;
    } catch(e) {
      return null;
    }
  }, [appUserFromSession, updateSettingsMutation, toast, queryClient]);


  // isAuthActionLoading now primarily for signup and update settings. Login loading is part of NextAuth's status.
  const isAuthActionLoading = signupMutation.isPending || updateSettingsMutation.isPending;

  return (
    <AuthContext.Provider value={{ 
        user: appUserFromSession, 
        login, 
        logout, 
        signup, 
        updateUserSettings, 
        loading, 
        isAuthActionLoading,
        session
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
