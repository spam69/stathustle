
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import type { SportInterest } from '@/types';
import { availableSports, sportInterestLevels } from '@/lib/mock-data';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Loader2, UploadCloud, X as CloseIcon, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added missing import
import { handleImageFileChange, uploadImageToR2 as uploadImageUtil, resetImageState as resetImageUtil, type ImageFileState } from '@/lib/image-upload-utils'; // Renamed for clarity
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  displayName: z.string().max(50, { message: "Display Name cannot exceed 50 characters." }).optional(),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  sportInterests: z.array(z.object({
    sport: z.string(),
    level: z.enum(['very interested', 'somewhat interested', 'no interest']),
  })).optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthActionLoading } = useAuth();
  const { toast } = useToast();

  const [profilePicState, setProfilePicState] = useState<ImageFileState>({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      sportInterests: availableSports.map(sport => ({ sport, level: 'no interest' })),
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    let finalProfilePicUrl: string | undefined = undefined;

    if (profilePicState.file) {
      setProfilePicState(prev => ({ ...prev, isUploading: true }));
      const uploadedUrl = await uploadImageUtil(profilePicState, setProfilePicState);
      if (uploadedUrl) {
        finalProfilePicUrl = uploadedUrl;
      } else {
        toast({ title: "Profile Picture Upload Failed", description: "Please try uploading again or proceed without it.", variant: "destructive" });
        setProfilePicState(prev => ({ ...prev, isUploading: false })); // Ensure uploading state is reset
        return;
      }
      setProfilePicState(prev => ({ ...prev, isUploading: false }));
    }


    const interests = data.sportInterests?.filter(interest => interest.level !== 'no interest') as SportInterest[];
    
    const signedUpUser = await signup({
      username: data.username,
      displayName: data.displayName || undefined, // Pass displayName
      email: data.email,
      password: data.password,
      sportInterests: interests,
      profilePictureUrl: finalProfilePicUrl, // Pass uploaded profile picture URL
    });

    if (signedUpUser) {
      resetImageUtil(setProfilePicState);
      // Toast for success is handled by AuthContext or you can push to login page where login success toast appears
      // router.push('/login'); // Already done by AuthContext if signup successful
    }
    // Error toast is handled by AuthContext's useMutation
  };
  
  const handleRemoveProfilePic = () => {
    resetImageUtil(setProfilePicState);
  };

  const overallSubmitting = isAuthActionLoading || profilePicState.isUploading;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
        <CardDescription>Enter your information to get started with StatHustle.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="username">Username (@)</FormLabel>
                  <FormControl>
                    <Input id="username" placeholder="your_username" {...field} disabled={overallSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="displayName">Display Name (Optional)</FormLabel>
                  <FormControl>
                    <Input id="displayName" placeholder="Your Public Name" {...field} disabled={overallSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input id="email" type="email" placeholder="m@example.com" {...field} disabled={overallSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input id="password" type="password" {...field} disabled={overallSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Profile Picture (Optional)</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={profilePicState.previewUrl || undefined} alt="Profile preview" data-ai-hint="avatar person" />
                  <AvatarFallback><ImageIcon className="h-10 w-10 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => profilePicInputRef.current?.click()} disabled={profilePicState.isUploading || overallSubmitting}>
                    {profilePicState.isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <UploadCloud className="mr-2 h-4 w-4" /> {profilePicState.file ? "Change" : "Upload"}
                  </Button>
                  <input type="file" ref={profilePicInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, setProfilePicState)} />
                  {profilePicState.previewUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveProfilePic} className="text-destructive hover:text-destructive/80" disabled={profilePicState.isUploading || overallSubmitting}>
                      <CloseIcon className="mr-2 h-4 w-4" /> Remove
                    </Button>
                  )}
                </div>
              </div>
              {profilePicState.file && <p className="text-xs text-muted-foreground mt-1">Selected: {profilePicState.file.name}</p>}
            </FormItem>
            
            <div className="space-y-2">
              <FormLabel className="font-headline">Sport Interests</FormLabel>
              <p className="text-sm text-muted-foreground">Select your level of interest for each sport.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-1">
                {availableSports.map((sport, index) => (
                  <FormField
                    key={sport}
                    control={form.control}
                    name={`sportInterests.${index}.level`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{sport}</FormLabel>
                        <input type="hidden" {...form.register(`sportInterests.${index}.sport`)} value={sport} />
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={overallSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interest" />
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
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={overallSubmitting}>
              {overallSubmitting ? (profilePicState.isUploading ? 'Uploading...' : 'Signing up...') : 'Sign Up'}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
