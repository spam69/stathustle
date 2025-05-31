
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

const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(1000, "Post too long."),
});

type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostFormProps {
  onPostCreated: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif' }) => void;
  isSubmitting: boolean; // Prop to indicate if submission is in progress
  isModal?: boolean;
}

export default function CreatePostForm({ onPostCreated, isSubmitting, isModal = false }: CreatePostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast(); // Keep for local UI feedback like adding mock media
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'gif' | undefined>(undefined);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = (data: PostFormValues) => { // No async needed here, mutation handles it
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
      return;
    }

    const postData = {
      content: data.content,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
    };

    onPostCreated(postData); // Call the handler from FeedContext (via props)
    
    // Reset form only if not submitting (i.e., success, handled by context)
    if (!isSubmitting) {
        form.reset();
        setMediaUrl(undefined);
        setMediaType(undefined);
    }
  };
  
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };

  const handleAddImageMock = () => {
    setMediaUrl("https://placehold.co/600x300.png?text=MockImage");
    setMediaType("image");
    toast({ title: "Image Added (Mock)", description: "A placeholder image has been attached."});
  };
  
  const handleAddGifMock = () => {
    setMediaUrl("https://placehold.co/400x200.png?text=MockGIF");
    setMediaType("gif");
    toast({ title: "GIF Added (Mock)", description: "A placeholder GIF has been attached."});
  };

  if (!user && !isModal) {
    return (
      <Card className="mb-6 p-4 text-center">
        <p className="text-muted-foreground">Please <a href="/login" className="underline text-primary">login</a> to create a post.</p>
      </Card>
    );
  }
  
  if (!user && isModal) return null;

  return (
    <Card className={`mb-6 shadow-lg ${isModal ? 'shadow-none border-0' : ''}`}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="p-4">
          <div className="flex gap-4 items-start">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user?.profilePictureUrl} alt={user?.username} data-ai-hint="person avatar"/>
              <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
            </Avatar>
            <Textarea
              {...form.register("content")}
              placeholder={`What's on your mind, ${user?.username}?`}
              className="min-h-[80px] flex-1 resize-none shadow-none focus-visible:ring-0"
              maxLength={1000}
            />
          </div>
          {form.formState.errors.content && (
            <p className="text-xs text-destructive mt-1 ml-14">{form.formState.errors.content.message}</p>
          )}
          {mediaUrl && (
            <div className="ml-14 mt-2 border rounded-md p-2 max-w-xs">
              <p className="text-xs text-muted-foreground">Attached {mediaType}:</p>
              <img src={mediaUrl} alt="Selected media" className="rounded max-h-24" data-ai-hint="uploaded media" />
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-destructive" onClick={() => {setMediaUrl(undefined); setMediaType(undefined)}}>
                Remove
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 pt-0 border-t">
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Add Image" onClick={handleAddImageMock} disabled={!!mediaUrl && mediaType !== 'image'}>
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Add GIF" onClick={handleAddGifMock} disabled={!!mediaUrl && mediaType !== 'gif'}>
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
          <Button type="submit" disabled={isSubmitting || (!form.formState.isDirty && !mediaUrl) || !form.formState.isValid && form.formState.isSubmitted} className="font-headline">
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

    