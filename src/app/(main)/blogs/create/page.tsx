
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Blog, User, Identity } from '@/types';
import { mockIdentities, mockUsers } from '@/lib/mock-data'; // For author lookup
import { Loader2 } from 'lucide-react';

const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(150, "Title must be 150 characters or less."),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters.")
    .max(100, "Slug must be 100 characters or less.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  coverImageUrl: z.string().url("Invalid URL format.").optional().or(z.literal('')),
  excerpt: z.string().max(300, "Excerpt must be 300 characters or less.").optional(),
  content: z.string().min(50, "Content must be at least 50 characters."),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

export default function CreateBlogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identityId = searchParams.get('identityId');
  const [authorInfo, setAuthorInfo] = useState<{ name: string, type: 'user' | 'identity', id: string } | null>(null);

  useEffect(() => {
    if (identityId) {
      const identity = mockIdentities.find(id => id.id === identityId);
      if (identity && currentUser && identity.owner.id === currentUser.id) {
        setAuthorInfo({ name: identity.displayName || identity.username, type: 'identity', id: identity.id });
      } else {
         toast({ title: "Error", description: "Invalid or unauthorized identity for posting.", variant: "destructive" });
         router.push('/blogs'); // Or back to settings
      }
    } else if (currentUser) {
      // Allow regular users to post blogs as themselves.
      // This part can be adjusted based on whether only identities should post.
      // For now, enabling it for users directly.
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
      slug: "",
      coverImageUrl: "",
      excerpt: "",
      content: "",
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-'); // Replace multiple hyphens with single hyphen
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && value.title) {
        const currentSlug = form.getValues('slug');
        // Auto-generate slug only if it's empty or was likely auto-generated from a previous title
        // This check is basic; more sophisticated logic might be needed if titles are frequently edited after slug generation.
        if (!currentSlug || currentSlug === generateSlug(form.getValues('title'))) {
           form.setValue('slug', generateSlug(value.title), { shouldValidate: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  const onSubmit = async (data: BlogPostFormValues) => {
    if (!authorInfo) {
        toast({ title: "Error", description: "Author information is missing.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        authorId: authorInfo.id, // This ID will be used by the API to find User or Identity
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
      router.push(`/blogs/${newBlog.author.username}/${newBlog.slug}`);

    } catch (error: any) {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser || !authorInfo) {
    return <div className="max-w-3xl mx-auto py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> <p className="mt-2">Loading author information...</p></div>;
  }

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
                      <Input placeholder="Your amazing blog post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="your-blog-post-slug" {...field} />
                    </FormControl>
                    <FormDescription>This will be part of the URL. Use lowercase letters, numbers, and hyphens.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/cover.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short summary of your blog post (max 300 characters)." {...field} rows={3} />
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
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write your blog post content here..." {...field} rows={15} />
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Publishing..." : "Publish Post"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
