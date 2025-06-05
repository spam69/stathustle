
"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep for other fields if any, or remove if not used
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import type { SportInterest, User } from '@/types';
import { availableSports, sportInterestLevels, mockIdentities } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Newspaper, Users, PlusCircle, Loader2, UploadCloud, X as CloseIcon, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { handleImageFileChange, uploadImageToR2, resetImageState, type ImageFileState } from '@/lib/image-upload-utils';
import { useToast } from '@/hooks/use-toast';

const settingsSchema = z.object({
  bio: z.string().max(300, "Bio cannot exceed 300 characters.").optional().nullable(),
  profilePictureUrl: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')).nullable(),
  bannerImageUrl: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')).nullable(),
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

  const [profilePicState, setProfilePicState] = useState<ImageFileState>({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });
  const [bannerState, setBannerState] = useState<ImageFileState>({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema.omit({ username: true, email: true })),
    defaultValues: {
      bio: "",
      profilePictureUrl: "",
      bannerImageUrl: "",
      sportInterests: availableSports.map(sport => ({ sport, level: 'no interest' })),
      themePreference: theme || 'system',
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
      // Initialize previews with existing URLs if no new file is selected yet
      if (!profilePicState.file && user.profilePictureUrl) {
        setProfilePicState(prev => ({ ...prev, previewUrl: user.profilePictureUrl, uploadedUrl: user.profilePictureUrl }));
      }
      if (!bannerState.file && user.bannerImageUrl) {
        setBannerState(prev => ({ ...prev, previewUrl: user.bannerImageUrl, uploadedUrl: user.bannerImageUrl }));
      }
    }
  }, [user, authLoading, router, form, theme]);

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) return;

    let finalProfilePicUrl = data.profilePictureUrl;
    if (profilePicState.file) {
      const uploadedUrl = await uploadImageToR2(profilePicState, setProfilePicState);
      if (uploadedUrl) {
        finalProfilePicUrl = uploadedUrl;
      } else if (profilePicState.file) { // Upload failed for a new file
        toast({ title: "Profile Picture Upload Failed", description: "Your profile picture was not uploaded. Please try again.", variant: "destructive"});
        return; // Stop submission
      }
    } else if (profilePicState.previewUrl === null && data.profilePictureUrl !== null) { // Image was explicitly removed
        finalProfilePicUrl = null;
    }


    let finalBannerUrl = data.bannerImageUrl;
    if (bannerState.file) {
      const uploadedUrl = await uploadImageToR2(bannerState, setBannerState);
      if (uploadedUrl) {
        finalBannerUrl = uploadedUrl;
      } else if (bannerState.file) { // Upload failed
         toast({ title: "Banner Image Upload Failed", description: "Your banner image was not uploaded. Please try again.", variant: "destructive"});
        return; // Stop submission
      }
    } else if (bannerState.previewUrl === null && data.bannerImageUrl !== null) { // Image was explicitly removed
        finalBannerUrl = null;
    }
    

    const settingsToUpdate: Partial<User> = {
      ...data,
      profilePictureUrl: finalProfilePicUrl,
      bannerImageUrl: finalBannerUrl,
      sportInterests: data.sportInterests?.filter(interest => interest.level !== 'no interest') as SportInterest[],
    };
    
    const updatedUser = await updateUserSettings(settingsToUpdate);
    if (updatedUser) {
      if (updatedUser.themePreference) setTheme(updatedUser.themePreference as 'light' | 'dark' | 'system');
      // Reset file states as URLs are now persisted
      if (updatedUser.profilePictureUrl) setProfilePicState({ file: null, previewUrl: updatedUser.profilePictureUrl, uploadedUrl: updatedUser.profilePictureUrl, isUploading: false });
      else resetImageState(setProfilePicState);
      if (updatedUser.bannerImageUrl) setBannerState({ file: null, previewUrl: updatedUser.bannerImageUrl, uploadedUrl: updatedUser.bannerImageUrl, isUploading: false });
      else resetImageState(setBannerState);
    }
  };

  const handleRemoveProfilePic = () => {
    resetImageState(setProfilePicState);
    form.setValue('profilePictureUrl', null); // Signal removal to form
  };

  const handleRemoveBanner = () => {
    resetImageState(setBannerState);
    form.setValue('bannerImageUrl', null);
  };

  const userOwnedIdentity = user ? mockIdentities.find(identity => identity.owner.id === user.id) : null;

  if (authLoading || !user) {
    return <div className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> <p className="mt-2">Loading settings...</p></div>;
  }
  
  const currentProfilePicDisplayUrl = profilePicState.previewUrl || user.profilePictureUrl;
  const currentBannerDisplayUrl = bannerState.previewUrl || user.bannerImageUrl;

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

              {/* Profile Picture Upload */}
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border">
                    <AvatarImage src={currentProfilePicDisplayUrl || undefined} alt="Profile Preview" />
                    <AvatarFallback><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => profilePicInputRef.current?.click()} disabled={profilePicState.isUploading}>
                      {profilePicState.isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UploadCloud className="mr-2 h-4 w-4" /> {profilePicState.file ? "Change" : "Upload"}
                    </Button>
                    <input type="file" ref={profilePicInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, setProfilePicState)} />
                    {(currentProfilePicDisplayUrl || profilePicState.file) && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveProfilePic} className="text-destructive hover:text-destructive/80" disabled={profilePicState.isUploading}>
                        <CloseIcon className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
                 {profilePicState.file && <p className="text-xs text-muted-foreground mt-1">Selected: {profilePicState.file.name}</p>}
                <FormMessage>{form.formState.errors.profilePictureUrl?.message}</FormMessage>
              </FormItem>

              {/* Banner Image Upload */}
              <FormItem>
                <FormLabel>Banner Image</FormLabel>
                <div className="space-y-2">
                  {currentBannerDisplayUrl && (
                    <div className="relative w-full h-32 rounded-md overflow-hidden border bg-muted">
                      <Image src={currentBannerDisplayUrl} alt="Banner Preview" layout="fill" objectFit="cover" />
                    </div>
                  )}
                  {!currentBannerDisplayUrl && !bannerState.file && (
                     <div className="w-full h-32 rounded-md border border-dashed flex items-center justify-center bg-muted">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                     </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={bannerState.isUploading}>
                      {bannerState.isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UploadCloud className="mr-2 h-4 w-4" /> {bannerState.file || currentBannerDisplayUrl ? "Change" : "Upload"}
                    </Button>
                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, setBannerState)} />
                    {(currentBannerDisplayUrl || bannerState.file) && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveBanner} className="text-destructive hover:text-destructive/80" disabled={bannerState.isUploading}>
                        <CloseIcon className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
                {bannerState.file && <p className="text-xs text-muted-foreground mt-1">Selected: {bannerState.file.name}</p>}
                <FormMessage>{form.formState.errors.bannerImageUrl?.message}</FormMessage>
              </FormItem>

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

          <Button type="submit" className="w-full md:w-auto" disabled={isMainFormSubmitting || profilePicState.isUploading || bannerState.isUploading}>
            {(isMainFormSubmitting || profilePicState.isUploading || bannerState.isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
