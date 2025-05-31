
"use client";

import type { User as AppUserType, SportInterest } from '@/types';
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
// signIn and signOut from 'next-auth/react' are no longer directly used here for login/logout
import type { Session } from 'next-auth';
import { mockAdminUser, mockUsers } from '@/lib/mock-data'; // Import mockAdminUser

interface AuthContextType {
  user: (AppUserType & { id: string; username: string }) | null;
  signup: (signupData: Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string }) => Promise<AppUserType | null>; // Password optional for mock
  updateUserSettings: (settings: Partial<Pick<AppUserType, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => Promise<AppUserType | null>;
  loading: boolean;
  isAuthActionLoading: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to simulate API call for updating user data in mockUsers
async function updateUserDataInMock(userId: string, settings: Partial<AppUserType>): Promise<AppUserType> {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found in mock data for update');
  }
  // Simulate update
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...settings };
  // In a real API, you'd omit the password from the return
  const { password, ...updatedUserNoPassword } = mockUsers[userIndex];
  return updatedUserNoPassword as AppUserType;
}


const adminAppUser: (AppUserType & { id: string; username: string }) = {
  id: mockAdminUser.id,
  username: mockAdminUser.username,
  email: mockAdminUser.email ?? '',
  profilePictureUrl: mockAdminUser.profilePictureUrl,
  bannerImageUrl: mockAdminUser.bannerImageUrl,
  bio: mockAdminUser.bio,
  sportInterests: mockAdminUser.sportInterests,
  themePreference: mockAdminUser.themePreference || 'system',
  isIdentity: false,
};

const mockAdminSession: Session = {
  user: {
    id: mockAdminUser.id,
    username: mockAdminUser.username,
    email: mockAdminUser.email,
    name: mockAdminUser.username,
    image: mockAdminUser.profilePictureUrl,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mock session to expire in 1 day
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loading = false; // Always false as we have a static admin user

  // Signup mutation - will be a no-op or mock
  const signupMutation = useMutation<AppUserType, Error, Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string }>({
    mutationFn: async (signupData) => {
      // This would call your /api/auth/signup if it were active
      console.warn("Signup functionality is mocked in dev mode. User not actually created via API.", signupData);
      // Simulate creating a user for mock purposes if needed, or just return a mock success
      const newMockUser: AppUserType = {
        id: `user-${Date.now()}`,
        ...signupData,
        isIdentity: false,
        themePreference: 'system',
      };
      return newMockUser;
    },
  });

  const signup = async (signupData: Omit<AppUserType, 'id' | 'themePreference' | 'isIdentity'> & { password?: string }) => {
    toast({ title: "Dev Mode", description: "Signup is disabled. Admin user is always logged in." });
    // try {
    //   const signedUpUser = await signupMutation.mutateAsync(signupData);
    //   toast({
    //     title: "Account Created (Mock)!",
    //     description: "Normally, you'd be logged in. In dev mode, admin is always active.",
    //   });
    //   return signedUpUser;
    // } catch (error: any) {
    //   toast({ title: "Signup Failed (Mock)", description: error.message || "Could not create account.", variant: "destructive" });
    //   return null;
    // }
    return null;
  };

  const updateSettingsMutation = useMutation<AppUserType, Error, Partial<AppUserType>>({
    mutationFn: (settings) => {
      // For dev mode, we can try to update the mockAdminUser in the mockUsers array
      return updateUserDataInMock(adminAppUser.id, settings);
    },
    onSuccess: (data) => {
      toast({ title: "Settings Updated (Mock)", description: "Admin user's mock data has been updated." });
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] });
      // No real session to invalidate, but if we had one: queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      toast({ title: "Update Failed (Mock)", description: error.message, variant: "destructive" });
    },
  });

  const updateUserSettings = useCallback(async (settings: Partial<Pick<AppUserType, 'sportInterests' | 'themePreference' | 'bio' | 'profilePictureUrl' | 'bannerImageUrl'>>) => {
    try {
      const updatedUser = await updateSettingsMutation.mutateAsync(settings);
      return updatedUser;
    } catch (e) {
      return null;
    }
  }, [updateSettingsMutation, toast, queryClient]);

  const isAuthActionLoading = signupMutation.isPending || updateSettingsMutation.isPending;

  return (
    <AuthContext.Provider value={{
      user: adminAppUser,
      signup,
      updateUserSettings,
      loading,
      isAuthActionLoading,
      session: mockAdminSession
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
