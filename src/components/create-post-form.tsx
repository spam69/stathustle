
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Film, Users, Paperclip, Smile, X, BarChart3, CalendarClock } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import GiphyPickerModal from './giphy-picker-modal';
import type { IGif } from '@giphy/js-types';

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
  if (!post || !post.author) {
    return (
      <Card className="mt-3 mb-2 border-border/70 shadow-sm bg-card/80">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Author information is unavailable for the shared post.</p>
        </CardContent>
      </Card>
    );
  }

  const authorDisplayName = 'isIdentity' in post.author && post.author.displayName ? post.author.displayName : post.author.username;
  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'S';

  return (
    <Card className="mt-3 mb-2 border border-border/50 shadow-sm bg-card/60 rounded-xl">
      <CardHeader className="flex flex-row items-start gap-3 p-3">
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={post.author.profilePictureUrl} alt={authorDisplayName} data-ai-hint="person avatar" />
          <AvatarFallback>{getInitials(authorDisplayName)}</AvatarFallback>
        </Avatar>
        <div className="grid gap-0.5 flex-1">
          <CardTitle className="text-sm font-semibold hover:underline font-headline text-foreground">
            <Link href={`/profile/${post.author.username}`}>{authorDisplayName}</Link>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs leading-relaxed line-clamp-3 text-foreground/90">{post.content.replace(/<[^>]+>/g, '')}</p>
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
  const [isGiphyModalOpen, setIsGiphyModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      sharedOriginalPostId: undefined,
    },
  });
  
  useEffect(() => {
    if (postToShare && postToShare.id) {
      form.setValue('sharedOriginalPostId', postToShare.id);
      form.setValue('content', ""); 
      setMediaUrl(undefined); // Clear any existing media when sharing
      setMediaType(undefined);
    } else {
      form.reset({ content: "", sharedOriginalPostId: undefined });
       // Don't clear media if not in share mode and postToShare is just null
      if (postToShare === null) { // Explicitly null means reset
        setMediaUrl(undefined);
        setMediaType(undefined);
      }
    }
  }, [postToShare, form]);


  const onSubmit = (data: PostFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
      return;
    }
    if (!data.content && !mediaUrl && !data.sharedOriginalPostId) {
      toast({ title: "Error", description: "Post cannot be empty.", variant: "destructive" });
      return;
    }

    const postData = {
      content: data.content || "",
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      sharedOriginalPostId: postToShare && postToShare.id ? postToShare.id : undefined,
    };

    onPostCreated(postData);
    
    form.reset({ content: "", sharedOriginalPostId: undefined });
    setMediaUrl(undefined);
    setMediaType(undefined);
  };
  
  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File Too Large", description: "Image size cannot exceed 5MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
        setMediaType("image");
        toast({ title: "Image Added", description: "Image ready for posting."});
      };
      reader.onerror = () => {
        toast({ title: "Error Reading File", description: "Could not read the selected image.", variant: "destructive"});
      }
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow selecting the same file again if removed then re-added
    if(event.target) event.target.value = '';
  };
  
  const handleGifSelect = (gif: IGif) => {
    const gifUrl = gif.images.downsized_medium?.url || gif.images.original.url;
    setMediaUrl(gifUrl);
    setMediaType("gif");
    setIsGiphyModalOpen(false);
    toast({ title: "GIF Added", description: "GIF attached from GIPHY."});
  };

  const removeMedia = () => {
    setMediaUrl(undefined);
    setMediaType(undefined);
  }

  if (!user && !isModal) {
    return (
      <Card className={`mb-6 p-4 text-center ${isModal ? 'border-0 shadow-none' : 'border border-border'}`}>
        <p className="text-muted-foreground">Please <a href="/login" className="underline text-primary">login</a> to create a post.</p>
      </Card>
    );
  }
  
  if (!user && isModal) return null;

  const isSharingMode = !!(postToShare && postToShare.id);

  return (
    <>
      <Card className={`mb-6 ${isModal ? 'shadow-none border-0' : 'shadow-md border border-border'}`}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className={`p-4 ${isModal ? 'pb-0' : ''}`}>
            <div className="flex gap-3 items-start">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user?.profilePictureUrl} alt={user?.username} data-ai-hint="person avatar"/>
                <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
              </Avatar>
              <Textarea
                {...form.register("content")}
                placeholder={isSharingMode ? "Add your thoughts..." : `What's happening, ${user?.username}?`}
                className="min-h-[70px] flex-1 resize-none shadow-none focus-visible:ring-0 border-0 bg-transparent p-1 text-base"
                maxLength={1000}
              />
            </div>
            {form.formState.errors.content && (
              <p className="text-xs text-destructive mt-1 ml-14">{form.formState.errors.content.message}</p>
            )}

            {isSharingMode && postToShare && (
              <div className="ml-14 mt-2 relative">
                  <SharedPostPreviewCard post={postToShare} />
                  {isModal && onCancelShare && (
                      <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={onCancelShare}
                          title="Cancel share"
                      >
                          <X className="h-4 w-4" />
                      </Button>
                  )}
              </div>
            )}

            {mediaUrl && !isSharingMode && (
              <div className="ml-14 mt-2 border border-border rounded-md p-2 max-w-xs bg-card/50 relative">
                <p className="text-xs text-muted-foreground mb-1">Attached {mediaType}:</p>
                <Image 
                    src={mediaUrl} 
                    alt="Selected media" 
                    width={200} 
                    height={mediaType === 'gif' ? 120 : 150} // Adjust height for different media types
                    objectFit={mediaType === 'gif' ? 'contain' : 'cover'}
                    className="rounded max-h-40 w-auto" data-ai-hint="uploaded media" 
                />
                {mediaType === 'gif' && <p className="text-[10px] text-muted-foreground mt-0.5">via GIPHY</p>}
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive/70 hover:text-destructive" onClick={removeMedia} title="Remove media">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className={`flex justify-between items-center p-4 ${isModal ? 'pt-2' : 'pt-2 border-t border-border'}`}>
            <div className="flex gap-0">
              {!isSharingMode && (
                <>
                  <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Add Image" onClick={handleImageUploadClick} disabled={!!mediaUrl}>
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <input type="file" ref={imageInputRef} onChange={handleImageFileChange} accept="image/*" className="hidden" />
                  <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Add GIF" onClick={() => setIsGiphyModalOpen(true)} disabled={!!mediaUrl}>
                    <Film className="h-5 w-5" />
                  </Button>
                </>
              )}
              <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Poll (mock)">
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Emoji (mock)">
                <Smile className="h-5 w-5" />
              </Button>
               <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Schedule (mock)">
                <CalendarClock className="h-5 w-5" />
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || (!form.getValues("content") && !mediaUrl && !isSharingMode) || (!form.formState.isValid && form.formState.isSubmitted)}
              className="font-headline rounded-full px-6"
            >
              {isSubmitting ? "Posting..." : (isSharingMode ? "Share" : "Post")}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <GiphyPickerModal
        isOpen={isGiphyModalOpen}
        onClose={() => setIsGiphyModalOpen(false)}
        onGifSelect={handleGifSelect}
      />
    </>
  );
}


    