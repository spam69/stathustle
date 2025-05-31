
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import type { SportInterest, User } from '@/types';
import { availableSports, sportInterestLevels, mockIdentities } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Newspaper, Users, PlusCircle } from 'lucide-react';
// Toast is handled by AuthContext for updateUserSettings

const settingsSchema = z.object({
  // Username and email are not typically updatable via a simple settings form
  // username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  // email: z.string().email({ message: "Invalid email address." }),
  bio: z.string().max(300, "Bio cannot exceed 300 characters.").optional().nullable(),
  profilePictureUrl: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')).nullable(),
  bannerImageUrl: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')).nullable(),
  sportInterests: z.array(z.object({
    sport: z.string(),
    level: z.enum(['very interested', 'somewhat interested', 'no interest']),
  })).optional(),
  themePreference: z.enum(['light', 'dark', 'system']),
});

type SettingsFormValues = Omit<z.infer<typeof settingsSchema>, 'username' | 'email'>; // Omit non-updatable fields for form

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUserSettings, loading: authLoading, isAuthActionLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  const form = useForm<SettingsFormValues>({ // Use the omitted type for form values
    resolver: zodResolver(settingsSchema.omit({ username: true, email: true })), // Omit for resolver too
    defaultValues: {
      bio: user?.bio || "",
      profilePictureUrl: user?.profilePictureUrl || "",
      bannerImageUrl: user?.bannerImageUrl || "",
      sportInterests: user?.sportInterests || availableSports.map(sport => ({ sport, level: 'no interest' })),
      themePreference: (user?.themePreference as 'light' | 'dark' | 'system' || theme || 'system')
    },
  });
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      form.reset({
        bio: user.bio || "",
        profilePictureUrl: user.profilePictureUrl || "",
        bannerImageUrl: user.bannerImageUrl || "",
        sportInterests: user.sportInterests && user.sportInterests.length > 0 
          ? user.sportInterests 
          : availableSports.map(sport => ({ sport, level: 'no interest' })),
        themePreference: (user.themePreference as 'light' | 'dark' | 'system' || theme || 'system'),
      });
    }
  }, [user, authLoading, router, form, theme]);


  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) return;

    const settingsToUpdate: Partial<User> = {
      sportInterests: data.sportInterests?.filter(interest => interest.level !== 'no interest') as SportInterest[],
      themePreference: data.themePreference as User['themePreference'],
      bio: data.bio,
      profilePictureUrl: data.profilePictureUrl,
      bannerImageUrl: data.bannerImageUrl,
    };
    
    const updatedUser = await updateUserSettings(settingsToUpdate);
    if (updatedUser && updatedUser.themePreference) {
      setTheme(updatedUser.themePreference as 'light' | 'dark' | 'system');
    }
    // Toast for success/error is handled by AuthContext's useMutation
  };

  const userOwnedIdentity = user ? mockIdentities.find(identity => identity.owner.id === user.id) : null;

  if (authLoading || !user) {
    return <div className="text-center p-10">Loading settings...</div>;
  }

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
            <CardContent className="space-y-4">
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
              <FormField
                control={form.control}
                name="profilePictureUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/avatar.png" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bannerImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/banner.png" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

          <Button type="submit" className="w-full md:w-auto" disabled={isAuthActionLoading}>
            {isAuthActionLoading ? 'Saving...' : 'Save Changes'}
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

    