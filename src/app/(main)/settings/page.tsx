
"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import type { SportInterest, User } from '@/types';
import { availableSports, sportInterestLevels, mockIdentities } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Newspaper, Users, PlusCircle, Loader2 } from 'lucide-react';
// Image related imports removed: UploadCloud, X as CloseIcon, Image as ImageIcon, Avatar, AvatarFallback, AvatarImage, Image
// Image util imports removed: handleImageFileChange, uploadImageToR2, resetImageState, type ImageFileState
import { useToast } from '@/hooks/use-toast';

const settingsSchema = z.object({
  bio: z.string().max(300, "Bio cannot exceed 300 characters.").optional().nullable(),
  // profilePictureUrl and bannerImageUrl removed from schema for this form
  sportInterests: z.array(z.object({
    sport: z.string(),
    level: z.enum(['very interested', 'somewhat interested', 'no interest']),
  })).optional(),
  themePreference: z.enum(['light', 'dark', 'system']),
});

type SettingsFormValues = Omit<z.infer<typeof settingsSchema>, 'username' | 'email'>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUserSettings, loading: authLoading, isAuthActionLoading: isMainFormSubmitting } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Removed profilePicState, bannerState, profilePicInputRef, bannerInputRef

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema), // Schema no longer includes username/email
    defaultValues: {
      bio: "",
      // profilePictureUrl: "", // Removed
      // bannerImageUrl: "", // Removed
      sportInterests: availableSports.map(sport => ({ sport, level: 'no interest' })),
      themePreference: theme || 'system',
    },
  });
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      const initialSportInterests = availableSports.map(sportName => {
        const userInterest = user.sportInterests?.find(interest => interest.sport === sportName);
        return {
          sport: sportName,
          level: userInterest ? userInterest.level : 'no interest',
        };
      });

      form.reset({
        bio: user.bio || "",
        // profilePictureUrl: user.profilePictureUrl || "", // Removed
        // bannerImageUrl: user.bannerImageUrl || "", // Removed
        sportInterests: initialSportInterests,
        themePreference: (user.themePreference as 'light' | 'dark' | 'system' || theme || 'system'),
      });
      // Removed image state initialization logic
    }
  }, [user, authLoading, router, form, theme]);

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) return;

    // Removed image upload logic and finalProfilePicUrl/finalBannerUrl
    
    const settingsToUpdate: Partial<Pick<User, 'bio' | 'sportInterests' | 'themePreference'>> = {
      bio: data.bio,
      sportInterests: data.sportInterests?.filter(interest => interest.level !== 'no interest') as SportInterest[],
      themePreference: data.themePreference,
      // profilePictureUrl and bannerImageUrl are no longer sent from this form
    };
    
    const updatedUser = await updateUserSettings(settingsToUpdate);
    if (updatedUser) {
      if (updatedUser.themePreference) setTheme(updatedUser.themePreference as 'light' | 'dark' | 'system');
      // Removed reset of image states
    }
  };

  // Removed handleRemoveProfilePic and handleRemoveBanner functions

  const userOwnedIdentity = user ? mockIdentities.find(identity => identity.owner.id === user.id) : null;

  if (authLoading || !user) {
    return <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> <p className="mt-2">Loading settings...</p></div>;
  }
  
  // Removed currentProfilePicDisplayUrl and currentBannerDisplayUrl

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 font-headline text-primary">Account Settings</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Profile Information</CardTitle>
              <CardDescription>Update your personal details. Username: @{user.username}, Email: {user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea placeholder="Tell us a bit about yourself" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profile Picture Upload Section Removed */}
              {/* Banner Image Upload Section Removed */}

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Sport Interests</CardTitle>
              <CardDescription>Let us know which sports you follow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto p-1">
              {availableSports.map((sport, index) => (
                <FormField
                  key={sport}
                  control={form.control}
                  name={`sportInterests.${index}.level`}
                  render={({ field }) => (
                    <FormItem className="p-4">
                      <FormLabel className="text-sm font-medium">{sport}</FormLabel>
                      <input type="hidden" {...form.register(`sportInterests.${index}.sport`)} value={sport} />
                      <Select onValueChange={field.onChange} value={field.value || 'no interest'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interest level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sportInterestLevels.map(level => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Theme Preference</CardTitle>
              <CardDescription>Choose your preferred interface theme.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="themePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full md:w-auto" disabled={isMainFormSubmitting}>
            {isMainFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-headline">Identity Management</CardTitle>
          <CardDescription>Manage or create your analyst identity.</CardDescription>
        </CardHeader>
        <CardContent>
          {userOwnedIdentity ? (
            <div>
              <p className="text-sm text-muted-foreground mb-1">You manage the identity:</p>
              <Link href={`/profile/${userOwnedIdentity.username}`} className="font-semibold text-primary hover:underline text-lg">
                @{userOwnedIdentity.username}
              </Link>
              <div className="mt-4 space-y-2 sm:space-y-0 sm:flex sm:space-x-2">
                <Button asChild variant="outline">
                  <Link href={`/settings/identity/${userOwnedIdentity.id}/team`}>
                    <Users className="mr-2 h-4 w-4" /> Manage Team
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/blogs/create?identityId=${userOwnedIdentity.id}`}>
                    <Newspaper className="mr-2 h-4 w-4" /> Create Blog Post
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Create an identity to share your analysis, build a brand, and collaborate with a team.
              </p>
              <Button asChild>
                <Link href="/settings/identity/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Identity
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
