
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
// Post type removed as it's not strictly needed for form values

const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(1000, "Post too long."),
  // mediaUrl and mediaType could be added here if managed by react-hook-form
  // For simplicity, we'll handle them outside the form schema for now.
});

type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostFormProps {
  onPostCreated: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif' }) => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast(); // Toast can still be used for form-specific feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Mock state for media, in a real app this would involve file inputs/upload logic
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'gif' | undefined>(undefined);


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

    // Simulate API call or processing
    await new Promise(resolve => setTimeout(resolve, 300));

    onPostCreated({
      content: data.content,
      // In a real app, mediaUrl and mediaType would come from file upload handling
      mediaUrl: mediaUrl, 
      mediaType: mediaType,
    });
    
    form.reset();
    setMediaUrl(undefined); // Reset media after post
    setMediaType(undefined);
    setIsSubmitting(false);
    // Toast for successful submission can be handled by the caller of onPostCreated
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Mock function to add an image
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


  if (!user) {
    // This component might be rendered conditionally by its parent,
    // but this check is a safeguard if used directly.
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
          {mediaUrl && (
            <div className="ml-14 mt-2 border rounded-md p-2 max-w-xs">
              <p className="text-xs text-muted-foreground">Attached {mediaType}:</p>
              <img src={mediaUrl} alt="Selected media" className="rounded max-h-24" />
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-destructive" onClick={() => {setMediaUrl(undefined); setMediaType(undefined)}}>
                Remove
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 pt-0 border-t">
          <div className="flex gap-1">
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
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid && form.formState.isSubmitted} className="font-headline">
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
