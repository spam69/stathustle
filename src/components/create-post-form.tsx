
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { Image as ImageIcon, Film, Users, Paperclip, Smile, X } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types'; // Import Post type
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image'; // For displaying media in shared post preview

// Schema allows content to be empty if a sharedOriginalPostId is present
const postSchema = z.object({
  content: z.string().max(1000, "Post too long.").optional(),
  sharedOriginalPostId: z.string().optional(),
}).refine(data => data.content || data.sharedOriginalPostId, {
  message: "Post cannot be empty unless you are sharing something.",
  path: ["content"], // Point error to content field
});


type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostFormProps {
  onPostCreated: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif', sharedOriginalPostId?: string }) => void;
  isSubmitting: boolean;
  isModal?: boolean;
  postToShare?: Post | null; // Post to be shared, passed from modal context
  onCancelShare?: () => void; // Callback to cancel sharing from within the form
}

// A mini card to display the post being shared
const SharedPostPreviewCard = ({ post }: { post: Post }) => {
  const authorDisplayName = 'isIdentity' in post.author && post.author.displayName ? post.author.displayName : post.author.username;
  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'S';

  return (
    <Card className="mt-3 mb-2 border-border/70 shadow-sm bg-muted/30">
      <CardHeader className="flex flex-row items-start gap-3 p-3">
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={post.author.profilePictureUrl} alt={authorDisplayName} data-ai-hint="person avatar" />
          <AvatarFallback>{getInitials(authorDisplayName)}</AvatarFallback>
        </Avatar>
        <div className="grid gap-0.5 flex-1">
          <CardTitle className="text-sm font-semibold hover:underline font-headline">
            <Link href={`/profile/${post.author.username}`}>{authorDisplayName}</Link>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs leading-relaxed line-clamp-3">{post.content.replace(/<[^>]+>/g, '') /* Strip HTML for preview */}</p>
        {post.mediaUrl && (
          <div className="mt-2 aspect-video relative overflow-hidden rounded-md border max-h-[100px]">
            <Image src={post.mediaUrl} alt="Shared post media" layout="fill" objectFit="cover" data-ai-hint="social media" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function CreatePostForm({ onPostCreated, isSubmitting, isModal = false, postToShare, onCancelShare }: CreatePostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'gif' | undefined>(undefined);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      sharedOriginalPostId: postToShare?.id,
    },
  });
  
  useEffect(() => {
    // Update sharedOriginalPostId in form if postToShare changes (e.g. modal opens with new share)
    form.setValue('sharedOriginalPostId', postToShare?.id);
     if(postToShare) { // If there's a post to share, content can be optional. Resetting might clear user's partial caption.
        // form.reset({ content: "", sharedOriginalPostId: postToShare.id });
     } else {
        form.reset({ content: "", sharedOriginalPostId: undefined });
     }
  }, [postToShare, form]);


  const onSubmit = (data: PostFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
      return;
    }

    const postData = {
      content: data.content || "", // Ensure content is string, even if empty
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      sharedOriginalPostId: postToShare?.id, // Always take from postToShare prop if available
    };

    onPostCreated(postData);
    
    if (!isSubmitting) {
        form.reset({ content: "", sharedOriginalPostId: undefined }); // Reset sharedId too
        setMediaUrl(undefined);
        setMediaType(undefined);
        if (onCancelShare) onCancelShare(); // Clear postToShare from context if modal
    }
  };
  
  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

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
              placeholder={postToShare ? "Add your thoughts..." : `What's on your mind, ${user?.username}?`}
              className="min-h-[80px] flex-1 resize-none shadow-none focus-visible:ring-0"
              maxLength={1000}
            />
          </div>
          {form.formState.errors.content && (
            <p className="text-xs text-destructive mt-1 ml-14">{form.formState.errors.content.message}</p>
          )}

          {postToShare && (
            <div className="ml-14 mt-2 relative">
                <SharedPostPreviewCard post={postToShare} />
                {isModal && onCancelShare && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-0 right-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={onCancelShare}
                        title="Cancel share"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
          )}

          {mediaUrl && !postToShare && ( // Only show media uploader if not sharing a post (to avoid confusion)
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
          <div className="flex gap-1 sm:gap-2">
            {!postToShare && ( // Don't show media buttons if we are in "share" mode
              <>
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Add Image" onClick={handleAddImageMock} disabled={!!mediaUrl && mediaType !== 'image'}>
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Add GIF" onClick={handleAddGifMock} disabled={!!mediaUrl && mediaType !== 'gif'}>
                  <Film className="h-5 w-5" />
                </Button>
              </>
            )}
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
          <Button 
            type="submit" 
            disabled={isSubmitting || (!form.formState.isDirty && !mediaUrl && !postToShare) || (!form.formState.isValid && form.formState.isSubmitted)} 
            className="font-headline"
          >
            {isSubmitting ? "Posting..." : (postToShare ? "Share Post" : "Post")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
