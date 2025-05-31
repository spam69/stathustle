"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Image as ImageIcon, Film, Users, Paperclip, Smile } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types'; // Assuming you'll define a Post type

const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(1000, "Post too long."),
});

type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostFormProps {
  onPostCreated: (newPost: Post) => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: PostFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: user,
      content: data.content,
      createdAt: new Date().toISOString(),
      reactions: 0,
      shares: 0,
      repliesCount: 0,
      // mediaUrl, mediaType, teamSnapshot, tags can be added here
    };
    
    onPostCreated(newPost);
    form.reset();
    setIsSubmitting(false);
    toast({ title: "Success", description: "Your post has been published!" });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return (
      <Card className="mb-6 p-4 text-center">
        <p className="text-muted-foreground">Please <a href="/login" className="underline text-primary">login</a> to create a post.</p>
      </Card>
    );
  }

  return (
    <Card className="mb-6 shadow-lg">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="p-4">
          <div className="flex gap-4 items-start">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user.profilePictureUrl} alt={user.username} />
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>
            <Textarea
              {...form.register("content")}
              placeholder={`What's on your mind, ${user.username}?`}
              className="min-h-[80px] flex-1 resize-none border-0 shadow-none focus-visible:ring-0 p-0"
              maxLength={1000}
            />
          </div>
          {form.formState.errors.content && (
            <p className="text-xs text-destructive mt-1 ml-14">{form.formState.errors.content.message}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 pt-0 border-t">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Add Image (mock)">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Add GIF (mock Giphy)">
              <Film className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Tag Users/Players (mock)">
              <Users className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Attach Fantasy Team (mock)">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Emoji (mock)">
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button type="submit" disabled={isSubmitting} className="font-headline">
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
