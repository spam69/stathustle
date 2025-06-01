
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Film, Users, Paperclip, Smile, X } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

const postSchema = z.object({
  content: z.string().max(1000, "Post too long.").optional(),
  sharedOriginalPostId: z.string().optional(),
}).refine(data => data.content || data.sharedOriginalPostId, {
  message: "Post cannot be empty unless you are sharing something.",
  path: ["content"],
});


type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostFormProps {
  onPostCreated: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif', sharedOriginalPostId?: string }) => void;
  isSubmitting: boolean;
  isModal?: boolean;
  postToShare?: Post | null;
  onCancelShare?: () => void;
}

const SharedPostPreviewCard = ({ post }: { post: Post }) => {
  // Guard against undefined post or post.author
  if (!post || !post.author) {
    return (
      <Card className="mt-3 mb-2 border-border/70 shadow-sm bg-muted/30">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Author information is unavailable for the shared post.</p>
        </CardContent>
      </Card>
    );
  }

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
      sharedOriginalPostId: undefined, // Always initialize to undefined
    },
  });
  
  useEffect(() => {
    if (postToShare && postToShare.id) { // If it's a valid post to share
      form.setValue('sharedOriginalPostId', postToShare.id);
      form.setValue('content', ""); // Clear content field when starting a share
    } else { // Not sharing, or postToShare is invalid/null
      form.reset({ content: "", sharedOriginalPostId: undefined });
    }
  }, [postToShare, form]);


  const onSubmit = (data: PostFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
      return;
    }

    const postData = {
      content: data.content || "",
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      // Ensure sharedOriginalPostId is only set if postToShare was valid
      sharedOriginalPostId: postToShare && postToShare.id ? postToShare.id : undefined,
    };

    onPostCreated(postData);
    
    // Reset form fields more comprehensively after submission
    form.reset({ content: "", sharedOriginalPostId: undefined });
    setMediaUrl(undefined);
    setMediaType(undefined);
    // If this form is in a modal, the modal's close handler (via FeedContext) will clear postToShare in the context.
    // If `onCancelShare` is provided (typically for modal close button), it's handled by the parent.
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

  // Determine if we are in "share" mode based on a valid postToShare object with an ID
  const isSharingMode = !!(postToShare && postToShare.id);

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
              placeholder={isSharingMode ? "Add your thoughts..." : `What's on your mind, ${user?.username}?`}
              className="min-h-[80px] flex-1 resize-none shadow-none focus-visible:ring-0"
              maxLength={1000}
            />
          </div>
          {form.formState.errors.content && (
            <p className="text-xs text-destructive mt-1 ml-14">{form.formState.errors.content.message}</p>
          )}

          {isSharingMode && postToShare && ( // Only render SharedPostPreviewCard if in valid sharing mode
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

          {mediaUrl && !isSharingMode && ( // Only show media preview if not sharing (media on shares not implemented)
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
            {!isSharingMode && ( // Media buttons only if not sharing
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
            disabled={isSubmitting || (!form.getValues("content") && !isSharingMode && !mediaUrl) || (!form.formState.isValid && form.formState.isSubmitted)}
            className="font-headline"
          >
            {isSubmitting ? "Posting..." : (isSharingMode ? "Share Post" : "Post")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

    