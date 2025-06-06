
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Blog } from '@/types';
import { mockIdentities } from '@/lib/mock-data';
import { Loader2, UploadCloud, X as CloseIcon, Image as ImageIcon, Smile } from 'lucide-react'; // Added Smile
import Image from 'next/image'; 
import { handleImageFileChange, uploadImageToR2, resetImageState, type ImageFileState } from '@/lib/image-upload-utils';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import EmojiPicker from '@/components/emoji-picker'; // Import EmojiPicker

const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(150, "Title must be 150 characters or less."),
  // Slug is no longer in schema, will be generated
  coverImageUrl: z.string().url("Invalid URL format.").optional().or(z.literal('')).nullable(),
  excerpt: z.string().max(300, "Excerpt must be 300 characters or less.").optional(),
  content: z.string().min(50, "Content must be at least 50 characters."),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

export default function CreateBlogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false); 

  const [coverImageState, setCoverImageState] = useState<ImageFileState>({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null); // Ref for content textarea

  const identityId = searchParams.get('identityId');
  const [authorInfo, setAuthorInfo] = useState<{ name: string, type: 'user' | 'identity', id: string } | null>(null);

  useEffect(() => {
    if (identityId) {
      const identity = mockIdentities.find(id => id.id === identityId);
      if (identity && currentUser && identity.owner.id === currentUser.id) {
        setAuthorInfo({ name: identity.displayName || identity.username, type: 'identity', id: identity.id });
      } else {
         toast({ title: "Error", description: "Invalid or unauthorized identity for posting.", variant: "destructive" });
         router.push('/blogs');
      }
    } else if (currentUser) {
      setAuthorInfo({ name: currentUser.username, type: 'user', id: currentUser.id });
    } else {
       toast({ title: "Authentication Error", description: "You must be logged in to create a blog post.", variant: "destructive" });
       router.push('/login');
    }
  }, [identityId, currentUser, router, toast]);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      // slug: "", // Removed slug from default values
      coverImageUrl: "",
      excerpt: "",
      content: "",
    },
  });

  // Removed useEffect for auto-generating slug from title

  const onSubmit = async (data: BlogPostFormValues) => {
    if (!authorInfo) {
        toast({ title: "Error", description: "Author information is missing.", variant: "destructive" });
        return;
    }
    setIsSubmittingForm(true);

    let finalCoverImageUrl = data.coverImageUrl;
    if (coverImageState.file) {
      const uploadedUrl = await uploadImageToR2(coverImageState, setCoverImageState);
      if (uploadedUrl) {
        finalCoverImageUrl = uploadedUrl;
      } else { 
        toast({ title: "Cover Image Upload Failed", description: "Please try uploading the cover image again or proceed without it.", variant: "destructive"});
        setIsSubmittingForm(false);
        return; 
      }
    } else if (coverImageState.previewUrl === null && data.coverImageUrl) { 
        finalCoverImageUrl = null;
    }

    const generatedSlug = uuidv4(); // Generate UUID for slug

    try {
      const payload = {
        ...data,
        slug: generatedSlug, // Add generated UUID slug to payload
        coverImageUrl: finalCoverImageUrl,
        authorId: authorInfo.id,
      };

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create blog post.");
      }

      const newBlog: Blog = await response.json();
      toast({ title: "Blog Post Created!", description: `"${newBlog.title}" has been published.` });
      resetImageState(setCoverImageState); 
      form.reset(); // Reset the form fields
      router.push(`/blogs/${newBlog.author.username}/${newBlog.slug}`);

    } catch (error: any) {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };
  
  const handleRemoveCoverImage = () => {
    resetImageState(setCoverImageState);
    form.setValue('coverImageUrl', null); 
  };

  const handleEmojiSelectForBlogContent = (emoji: string) => {
    const currentContent = form.getValues("content") || "";
    form.setValue("content", currentContent + emoji);
    contentTextareaRef.current?.focus();
  };


  if (!currentUser || !authorInfo) {
    return <div className="max-w-3xl mx-auto py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> <p className="mt-2">Loading author information...</p></div>;
  }

  const isUploadingAnyImage = coverImageState.isUploading;
  const overallSubmitting = isSubmittingForm || isUploadingAnyImage;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Create New Blog Post</CardTitle>
          <CardDescription>
            Share your insights with the StatHustle community. Posting as: <span className="font-semibold">{authorInfo.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <input type="text" placeholder="Your amazing blog post title" {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Slug Field Removed */}
              
              <FormItem>
                <FormLabel>Cover Image (Optional)</FormLabel>
                 <div className="space-y-2">
                  {(coverImageState.previewUrl || form.getValues('coverImageUrl')) && (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted">
                      <Image 
                        src={coverImageState.previewUrl || form.getValues('coverImageUrl')!} 
                        alt="Cover image preview" 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint="blog cover"
                      />
                    </div>
                  )}
                  {!(coverImageState.previewUrl || form.getValues('coverImageUrl')) && (
                     <div className="w-full aspect-video rounded-md border border-dashed flex items-center justify-center bg-muted">
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                     </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => coverImageInputRef.current?.click()} disabled={coverImageState.isUploading}>
                      {coverImageState.isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UploadCloud className="mr-2 h-4 w-4" /> {coverImageState.file || form.getValues('coverImageUrl') ? "Change" : "Upload"}
                    </Button>
                    <input type="file" ref={coverImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, setCoverImageState)} />
                    {(coverImageState.previewUrl || form.getValues('coverImageUrl') || coverImageState.file) && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoverImage} className="text-destructive hover:text-destructive/80" disabled={coverImageState.isUploading}>
                        <CloseIcon className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
                {coverImageState.file && <p className="text-xs text-muted-foreground mt-1">Selected: {coverImageState.file.name}</p>}
                <FormMessage>{form.formState.errors.coverImageUrl?.message}</FormMessage>
              </FormItem>

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short summary of your blog post (max 300 characters)." {...field} value={field.value ?? ""} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1">
                      <FormLabel>Content</FormLabel>
                      <EmojiPicker 
                        onEmojiSelect={handleEmojiSelectForBlogContent} 
                        triggerButtonSize="xs"
                        triggerButtonVariant="outline"
                        popoverSide="bottom"
                      />
                    </div>
                    <FormControl>
                      <Textarea 
                        ref={contentTextareaRef}
                        placeholder="Write your blog post content here..." 
                        {...field} 
                        rows={15} 
                      />
                    </FormControl>
                    <FormDescription>Markdown is not yet supported. Use plain text for now.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild type="button">
                  <Link href="/blogs">Cancel</Link>
                </Button>
                <Button type="submit" disabled={overallSubmitting}>
                  {overallSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmittingForm ? "Publishing..." : (coverImageState.isUploading ? "Uploading Cover..." : "Publish Post")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
