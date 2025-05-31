
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
  
  const appUserFromSession = session?.user ? {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email ?? '', 
    profilePictureUrl: session.user.image ?? mockUsers.find(u => u.id === session.user.id)?.profilePictureUrl,
    bannerImageUrl: mockUsers.find(u => u.id === session.user.id)?.bannerImageUrl,
    bio: mockUsers.find(u => u.id === session.user.id)?.bio,
    sportInterests: mockUsers.find(u => u.id === session.user.id)?.sportInterests,
    themePreference: mockUsers.find(u => u.id === session.user.id)?.themePreference || 'system',
    isIdentity: false, 
  } as (AppUser & { id: string; username: string }) : null;


  const login = async (credentials: { emailOrUsername: string; password: string }) => {
    const result = await signIn('credentials', {
      redirect: false, 
      emailOrUsername: credentials.emailOrUsername,
      password: credentials.password,
    });

    if (result?.error) {
      console.error("NextAuth SignIn Error:", result.error); // Log to browser console
      toast({ title: "Login Failed", description: result.error === "CredentialsSignin" ? "Invalid credentials." : result.error, variant: "destructive" });
      return false;
    }
    if (result?.ok) {
      toast({ title: "Login Successful", description: `Welcome back!`});
      queryClient.invalidateQueries({ queryKey: ['posts'] }); 
      queryClient.invalidateQueries({ queryKey: ['profile', credentials.emailOrUsername] }); 
      return true;
    }
    return false;
  };

  const logout = () => {
    signOut({ callbackUrl: '/login' }); 
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
    queryClient.clear();
  };

  const signupMutation = useMutation<AppUser, Error, Omit<AppUser, 'id' | 'themePreference' | 'isIdentity'> & { password: string }>({
    mutationFn: signupUser,
    onError: (error) => {
      // This error is for the /api/auth/signup call itself.
      toast({ title: "Account Creation Failed", description: error.message, variant: "destructive" });
    },
  });

  const signup = async (signupData: Omit<AppUser, 'id' | 'themePreference' | 'isIdentity'> & { password: string }) => {
    let signedUpUser: AppUser | null = null;
    try {
      signedUpUser = await signupMutation.mutateAsync(signupData);
    } catch (error) {
      // Error already handled by signupMutation.onError
      return null;
    }

    if (signedUpUser) {
      toast({
        title: "Account Created!",
        description: "Attempting to log you in automatically...",
      });
      
      // Attempt to log in the user automatically.
      // The login function itself handles success/failure toasts for the NextAuth part.
      await login({ 
        emailOrUsername: signedUpUser.email, 
        password: signupData.password,
      });
      
      // Return the signedUpUser so the page can redirect, regardless of auto-login success.
      // The user has an account, they can manually log in if auto-login failed.
      return signedUpUser; 
    }
    return null; // Signup API call failed
  };
  
  const updateSettingsMutation = useMutation<AppUser, Error, Partial<AppUser>>({
    mutationFn: (settings) => {
      if (!appUserFromSession) throw new Error("User not logged in");
      return updateUserData(appUserFromSession.id, settings);
    },
    onSuccess: (data) => {
      toast({ title: "Settings Updated", description: "Your profile information has been saved." });
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] });
      queryClient.invalidateQueries({ queryKey: ['session'] }); 
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

import { mockUsers } from '@/lib/mock-data';
