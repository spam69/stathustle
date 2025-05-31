"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { SportInterest, SportInterestLevel, User } from '@/types';
import { availableSports, sportInterestLevels } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';


const settingsSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  bio: z.string().max(300, "Bio cannot exceed 300 characters.").optional(),
  profilePictureUrl: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  bannerImageUrl: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  sportInterests: z.array(z.object({
    sport: z.string(),
    level: z.enum(['very interested', 'somewhat interested', 'no interest']),
  })).optional(),
  themePreference: z.enum(['light', 'dark', 'system']), // 'pink', 'blue' for future
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUserInterests, updateThemePreference, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
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
        username: user.username,
        email: user.email,
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


  const onSubmit = (data: SettingsFormValues) => {
    if (!user) return;

    const updatedInterests = data.sportInterests?.filter(interest => interest.level !== 'no interest') as SportInterest[];
    updateUserInterests(updatedInterests);
    
    // This mock auth context doesn't update username/email/bio etc. on the user object directly,
    // but in a real app this would be an API call.
    // For theme, we call both next-themes and our mock context.
    setTheme(data.themePreference);
    updateThemePreference(data.themePreference as 'light' | 'dark'); // Assuming pink/blue not yet active in AuthContext

    toast({
      title: "Settings Updated",
      description: "Your profile information has been saved.",
    });
  };

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
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input placeholder="Your username" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea placeholder="Tell us a bit about yourself" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="https://example.com/avatar.png" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="https://example.com/banner.png" {...field} /></FormControl>
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
                    <FormItem className="p-4"> {/* Added padding here */}
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
                        {/* <SelectItem value="pink" disabled>Pink (Coming Soon)</SelectItem>
                        <SelectItem value="blue" disabled>Blue (Coming Soon)</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full md:w-auto">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}
