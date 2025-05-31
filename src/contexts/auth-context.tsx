
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
    // Attempt to get these from mockUsers if session doesn't have them directly
    // In a real app, these would ideally be part of the session/JWT token
    // or fetched separately after login.
    profilePictureUrl: session.user.image ?? mockUsers.find(u => u.id === session.user.id)?.profilePictureUrl,
    bannerImageUrl: mockUsers.find(u => u.id === session.user.id)?.bannerImageUrl,
    bio: mockUsers.find(u => u.id === session.user.id)?.bio,
    sportInterests: mockUsers.find(u => u.id === session.user.id)?.sportInterests,
    themePreference: mockUsers.find(u => u.id === session.user.id)?.themePreference || 'system',
    isIdentity: false, // Assuming NextAuth session user is not an Identity by default here
  } as (AppUser & { id: string; username: string }) : null;


  const login = async (credentials: { emailOrUsername: string; password: string }) => {
    const result = await signIn('credentials', {
      redirect: false, 
      emailOrUsername: credentials.emailOrUsername,
      password: credentials.password,
    });

    if (result?.error) {
      console.error("NextAuth SignIn Error:", result.error);
      toast({ title: "Login Failed", description: result.error === "CredentialsSignin" ? "Invalid credentials." : result.error, variant: "destructive" });
      return false;
    }
    if (result?.ok) {
      toast({ title: "Login Successful", description: `Welcome back!`});
      queryClient.invalidateQueries({ queryKey: ['posts'] }); 
      queryClient.invalidateQueries({ queryKey: ['profile', credentials.emailOrUsername] }); // also invalidate profile
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
      // This specific error is handled by the main signup function's try/catch as well,
      // but direct API errors will be caught here.
      toast({ title: "Signup API Failed", description: error.message, variant: "destructive" });
    },
  });

  const signup = async (signupData: Omit<AppUser, 'id' | 'themePreference' | 'isIdentity'> & { password: string }) => {
    try {
      const signedUpUser = await signupMutation.mutateAsync(signupData);

      if (signedUpUser) {
        toast({
          title: "Account Created!",
          description: "Logging you in automatically...",
        });
        
        const loginSuccess = await login({ 
          emailOrUsername: signedUpUser.email, 
          password: signupData.password,
        });

        // The login function handles its own success/failure toasts.
        // If login was not successful, the user might still be "signed up" but not logged in.
        // The page redirection should still occur based on signup success.
        return signedUpUser; 
      }
      return null;
    } catch (error: any) {
      // Catch errors from signupUser (if not already handled by mutation's onError, e.g. network issues before API call)
      // Or other issues in this flow.
       if (!signupMutation.isError) { // Avoid double-toasting if mutation already caught it
         toast({ title: "Signup Process Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
       }
      return null;
    }
  };
  
  const updateSettingsMutation = useMutation<AppUser, Error, Partial<AppUser>>({
    mutationFn: (settings) => {
      if (!appUserFromSession) throw new Error("User not logged in");
      return updateUserData(appUserFromSession.id, settings);
    },
    onSuccess: (data) => {
      toast({ title: "Settings Updated", description: "Your profile information has been saved." });
      // Update the session or refetch if necessary, or rely on next refetch of profile data
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] });
      queryClient.invalidateQueries({ queryKey: ['session'] }); // Invalidate NextAuth session to pick up changes if any were made to session-relevant fields
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
      // error already handled by mutation's onError
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

// Helper to get mockUsers, ensure it's available for AuthContext
// This is a bit of a workaround because client components can't directly import server-only data easily
// In a real app, these details would come from the session/JWT or an API call.
import { mockUsers } from '@/lib/mock-data';
