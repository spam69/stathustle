
"use client";

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X as CloseIcon, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { handleImageFileChange, uploadImageToR2, resetImageState, type ImageFileState } from '@/lib/image-upload-utils';
import type { Identity } from '@/types';


const identitySchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters.").max(30, "Username cannot exceed 30 characters.").regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, periods, and hyphens."),
  displayName: z.string().max(50, "Display Name cannot exceed 50 characters.").optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

export default function CreateIdentityPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [profilePicState, setProfilePicState] = useState<ImageFileState>({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [bannerImageState, setBannerImageState] = useState<ImageFileState>({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });
  const bannerImageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      bio: "",
    },
  });

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!currentUser && !authLoading) {
    router.push('/login');
    return null;
  }

  const onSubmit = async (data: IdentityFormValues) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to create an identity.", variant: "destructive" });
      return;
    }
    setIsSubmittingForm(true);

    let finalProfilePicUrl: string | undefined = undefined;
    if (profilePicState.file) {
      const uploadedUrl = await uploadImageToR2(profilePicState, setProfilePicState);
      if (uploadedUrl) {
        finalProfilePicUrl = uploadedUrl;
      } else {
        toast({ title: "Profile Picture Upload Failed", description: "Please try uploading again or proceed without it.", variant: "destructive" });
        setIsSubmittingForm(false);
        return;
      }
    }

    let finalBannerImageUrl: string | undefined = undefined;
    if (bannerImageState.file) {
      const uploadedUrl = await uploadImageToR2(bannerImageState, setBannerImageState);
      if (uploadedUrl) {
        finalBannerImageUrl = uploadedUrl;
      } else {
        toast({ title: "Banner Image Upload Failed", description: "Please try uploading again or proceed without it.", variant: "destructive" });
        setIsSubmittingForm(false);
        return;
      }
    }

    try {
      const payload = {
        ...data,
        ownerId: currentUser.id,
        profilePictureUrl: finalProfilePicUrl,
        bannerImageUrl: finalBannerImageUrl,
      };

      const response = await fetch('/api/identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create identity.");
      }

      const newIdentity: Identity = await response.json();
      toast({ title: "Identity Created!", description: `@${newIdentity.username} has been successfully created.` });
      resetImageState(setProfilePicState);
      resetImageState(setBannerImageState);
      form.reset();
      // TODO: Invalidate query for user's owned identities if settings page uses one
      router.push('/settings');

    } catch (error: any) {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const isUploadingAnyImage = profilePicState.isUploading || bannerImageState.isUploading;
  const overallSubmitting = isSubmittingForm || isUploadingAnyImage;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Create New Identity</CardTitle>
          <CardDescription>
            Establish your analyst brand or public persona on StatHustle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identity Username (@)</FormLabel>
                    <FormControl>
                      <Input placeholder="your_identity_handle" {...field} disabled={overallSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Identity's Public Name" {...field} disabled={overallSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} disabled={overallSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your identity (max 500 characters)." {...field} value={field.value ?? ""} rows={3} disabled={overallSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Profile Picture (Optional)</FormLabel>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border">
                    <AvatarImage src={profilePicState.previewUrl || undefined} alt="Profile preview" data-ai-hint="identity logo avatar"/>
                    <AvatarFallback><ImageIcon className="h-10 w-10 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => profilePicInputRef.current?.click()} disabled={profilePicState.isUploading || overallSubmitting}>
                      {profilePicState.isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UploadCloud className="mr-2 h-4 w-4" /> {profilePicState.file ? "Change" : "Upload"}
                    </Button>
                    <input type="file" ref={profilePicInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, setProfilePicState)} />
                    {profilePicState.previewUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => resetImageState(setProfilePicState)} className="text-destructive hover:text-destructive/80" disabled={profilePicState.isUploading || overallSubmitting}>
                        <CloseIcon className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
                {profilePicState.file && <p className="text-xs text-muted-foreground mt-1">Selected: {profilePicState.file.name}</p>}
              </FormItem>

              <FormItem>
                <FormLabel>Banner Image (Optional)</FormLabel>
                 <div className="space-y-2">
                  {bannerImageState.previewUrl ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted">
                      <Image src={bannerImageState.previewUrl} alt="Banner image preview" layout="fill" objectFit="cover" data-ai-hint="identity banner"/>
                    </div>
                  ) : (
                     <div className="w-full aspect-video rounded-md border border-dashed flex items-center justify-center bg-muted">
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                     </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => bannerImageInputRef.current?.click()} disabled={bannerImageState.isUploading || overallSubmitting}>
                      {bannerImageState.isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UploadCloud className="mr-2 h-4 w-4" /> {bannerImageState.file ? "Change" : "Upload"}
                    </Button>
                    <input type="file" ref={bannerImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, setBannerImageState)} />
                    {bannerImageState.previewUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => resetImageState(setBannerImageState)} className="text-destructive hover:text-destructive/80" disabled={bannerImageState.isUploading || overallSubmitting}>
                        <CloseIcon className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
                {bannerImageState.file && <p className="text-xs text-muted-foreground mt-1">Selected: {bannerImageState.file.name}</p>}
              </FormItem>

              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild type="button" disabled={overallSubmitting}>
                  <Link href="/settings">Cancel</Link>
                </Button>
                <Button type="submit" disabled={overallSubmitting}>
                  {overallSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmittingForm ? "Creating..." : (isUploadingAnyImage ? "Uploading..." : "Create Identity")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
