
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form'; // Import Controller
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Film, Users, Paperclip, Smile, X, BarChart3, CalendarClock, Loader2, Newspaper, ArrowRight } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Post, BlogShareDetails } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import GiphyPickerModal from './giphy-picker-modal';
import type { IGif } from '@giphy/js-types';
import { useFeed } from '@/contexts/feed-context';
import EmojiPicker from './emoji-picker';

const postSchema = z.object({
  content: z.string().max(1000, "Post too long.").optional(),
  sharedOriginalPostId: z.string().optional(),
  blogShareUrl: z.string().url().optional(),
}).refine(data => data.content || data.sharedOriginalPostId || data.blogShareUrl, {
  message: "Post cannot be empty unless you are sharing something.",
  path: ["content"],
});

type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostFormProps {
  onPostCreated: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif', sharedOriginalPostId?: string, blogShareDetails?: BlogShareDetails }) => void;
  isSubmitting: boolean;
  isModal?: boolean;
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

const BlogSharePreviewCard = ({ blogDetails }: { blogDetails: BlogShareDetails }) => {
    return (
        <Card className="mt-3 mb-2 border border-primary/30 shadow-sm bg-primary/5 rounded-xl">
            <CardHeader className="flex flex-row items-start gap-3 p-3">
                {blogDetails.coverImageUrl ? (
                     <Image src={blogDetails.coverImageUrl} alt={blogDetails.title} width={60} height={34} className="rounded object-cover aspect-video" data-ai-hint="blog cover small"/>
                ) : (
                    <Newspaper className="h-8 w-8 text-primary mt-1 shrink-0" />
                )}
                <div className="grid gap-0.5 flex-1">
                     <p className="text-[10px] uppercase font-semibold text-primary tracking-wider">Sharing Blog</p>
                    <CardTitle className="text-sm font-semibold font-headline text-foreground">
                        {blogDetails.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        By <Link href={`/profile/${blogDetails.authorUsername}`} className="hover:underline">{blogDetails.authorDisplayName}</Link>
                    </p>
                </div>
            </CardHeader>
            {blogDetails.excerpt && (
                <CardContent className="p-3 pt-0">
                    <p className="text-xs leading-relaxed line-clamp-2 text-foreground/90">{blogDetails.excerpt}</p>
                </CardContent>
            )}
        </Card>
    );
};


export default function CreatePostForm({ onPostCreated, isSubmitting, isModal = false }: CreatePostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { postToShare, pendingBlogShare, closeCreatePostModal } = useFeed();
  
  const [imageToUpload, setImageToUpload] = useState<{ file: File, localPreviewUrl: string } | null>(null);
  const [gifUrl, setGifUrl] = useState<string | undefined>(undefined);
  const [isGiphyModalOpen, setIsGiphyModalOpen] = useState(false);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      sharedOriginalPostId: undefined,
      blogShareUrl: undefined,
    },
  });
  
  useEffect(() => {
    if (postToShare && postToShare.id) {
      form.setValue('sharedOriginalPostId', postToShare.id);
      form.setValue('content', ""); 
      form.setValue('blogShareUrl', undefined);
      setImageToUpload(null);
      setGifUrl(undefined);
    } else if (pendingBlogShare) {
      form.setValue('sharedOriginalPostId', undefined);
      form.setValue('content', ""); 
      form.setValue('blogShareUrl', pendingBlogShare.url); 
      setImageToUpload(null);
      setGifUrl(undefined);
    } else {
      form.reset({ content: "", sharedOriginalPostId: undefined, blogShareUrl: undefined });
      if (postToShare === null && pendingBlogShare === null) { 
        setImageToUpload(null);
        setGifUrl(undefined);
      }
    }
  }, [postToShare, pendingBlogShare, form]);

  const uploadImageToR2Internal = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64DataUri = reader.result as string;
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64DataUri,
              fileName: file.name,
              fileType: file.type,
            }),
          });
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Upload to R2 failed');
          }
          console.log("R2 Upload Successful. Public URL:", result.url);
          resolve(result.url);
        } catch (error) {
          console.error("R2 Upload error:", error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error("Failed to read file for upload."));
      };
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: PostFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
      return;
    }
    // Validation is now handled by Zod schema's refine, form.formState.isValid will reflect this
    // if (!data.content && !imageToUpload && !gifUrl && !data.sharedOriginalPostId && !pendingBlogShare) {
    //   toast({ title: "Error", description: "Post cannot be empty.", variant: "destructive" });
    //   return;
    // }

    let finalMediaUrl: string | undefined = gifUrl;
    let finalMediaType: 'image' | 'gif' | undefined = gifUrl ? 'gif' : undefined;

    if (imageToUpload) {
      setIsUploadingToR2(true);
      try {
        const r2Url = await uploadImageToR2Internal(imageToUpload.file);
        if (r2Url) {
          finalMediaUrl = r2Url;
          finalMediaType = 'image';
        } else {
          toast({ title: "Upload Failed", description: "Could not upload image to storage. Please try again.", variant: "destructive" });
          setIsUploadingToR2(false);
          return;
        }
      } catch (error: any) {
        toast({ title: "Upload Error", description: error.message || "An unexpected error occurred during image upload.", variant: "destructive" });
        setIsUploadingToR2(false);
        return;
      }
      setIsUploadingToR2(false);
    }

    const postData = {
      content: data.content || "",
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType,
      sharedOriginalPostId: postToShare && postToShare.id ? postToShare.id : undefined,
      blogShareDetails: pendingBlogShare ? pendingBlogShare : undefined,
    };

    onPostCreated(postData); 
    
    if (!isModal) { 
        form.reset({ content: "", sharedOriginalPostId: undefined, blogShareUrl: undefined });
        setImageToUpload(null);
        setGifUrl(undefined);
    }
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
      if (file.size > 5 * 1024 * 1024) { 
        toast({ title: "File Too Large", description: "Image size cannot exceed 5MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToUpload({ file, localPreviewUrl: reader.result as string });
        setGifUrl(undefined); 
        toast({ title: "Image Selected", description: "Image ready for posting."});
      };
      reader.onerror = () => {
        toast({ title: "Error Reading File", description: "Could not read the selected image.", variant: "destructive"});
      }
      reader.readAsDataURL(file);
    }
    if(event.target) event.target.value = ''; 
  };
  
  const handleGifSelect = (gif: IGif) => {
    const selectedGifUrl = gif.images.downsized_medium?.url || gif.images.original.url;
    setGifUrl(selectedGifUrl);
    setImageToUpload(null); 
    setIsGiphyModalOpen(false);
    toast({ title: "GIF Added", description: "GIF attached from GIPHY."});
  };

  const removeMedia = () => {
    setImageToUpload(null);
    setGifUrl(undefined);
  }

  const handleEmojiSelectForPost = (emoji: string) => {
    const currentContent = form.getValues("content") || "";
    form.setValue("content", currentContent + emoji, { shouldDirty: true, shouldValidate: true });
    contentTextareaRef.current?.focus();
  };

  if (!user && !isModal) {
    return (
      <Card className={`mb-6 p-4 text-center ${isModal ? 'border-0 shadow-none' : 'border border-border'}`}>
        <p className="text-muted-foreground">Please <a href="/login" className="underline text-primary">login</a> to create a post.</p>
      </Card>
    );
  }
  
  if (!user && isModal) return null;

  const isRegularSharingMode = !!(postToShare && postToShare.id);
  const isBlogSharingMode = !!pendingBlogShare;
  const hasMediaSelected = !!(imageToUpload || gifUrl);
  const overallSubmitting = isUploadingToR2 || isSubmitting;

  return (
    <>
      <Card className={`mb-6 ${isModal ? 'shadow-none border-0' : 'border border-border'}`}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className={`p-4 ${isModal ? 'pb-0' : ''}`}>
            <div className="flex gap-3 items-start">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user?.profilePictureUrl} alt={user?.username} data-ai-hint="person avatar"/>
                <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
              </Avatar>
              <Controller
                name="content"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    ref={(e) => {
                      field.ref(e); // RHF's internal ref
                      contentTextareaRef.current = e; // Your custom ref
                    }}
                    placeholder={isRegularSharingMode ? "Add your thoughts to the shared post..." : isBlogSharingMode ? "Add your thoughts about the blog..." : `What's happening, ${user?.username}?`}
                    className="min-h-[70px] flex-1 resize-none shadow-none focus-visible:ring-0 border-0 bg-transparent p-1 text-base"
                    maxLength={1000}
                    disabled={overallSubmitting}
                  />
                )}
              />
            </div>
            {form.formState.errors.content && (
              <p className="text-xs text-destructive mt-1 ml-14">{form.formState.errors.content.message}</p>
            )}

            {isRegularSharingMode && postToShare && (
              <div className="ml-14 mt-2 relative">
                  <SharedPostPreviewCard post={postToShare} />
                  {isModal && (
                      <Button 
                          type="button" variant="ghost" size="icon" 
                          className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={closeCreatePostModal} title="Cancel share" disabled={overallSubmitting}
                      > <X className="h-4 w-4" /> </Button>
                  )}
              </div>
            )}
            
            {isBlogSharingMode && pendingBlogShare && (
                 <div className="ml-14 mt-2 relative">
                    <BlogSharePreviewCard blogDetails={pendingBlogShare} />
                    {isModal && (
                         <Button 
                            type="button" variant="ghost" size="icon" 
                            className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={closeCreatePostModal} title="Cancel share" disabled={overallSubmitting}
                         > <X className="h-4 w-4" /> </Button>
                    )}
                </div>
            )}


            {!isRegularSharingMode && !isBlogSharingMode && (imageToUpload?.localPreviewUrl || gifUrl) && (
              <div className="ml-14 mt-2 border border-border rounded-md p-2 max-w-xs bg-card/50 relative">
                <p className="text-xs text-muted-foreground mb-1">Attached {imageToUpload ? 'image' : 'GIF'}:</p>
                <Image 
                    src={imageToUpload ? imageToUpload.localPreviewUrl : gifUrl!} 
                    alt="Selected media" width={200} height={gifUrl ? 120 : 150}
                    objectFit={gifUrl ? 'contain' : 'cover'}
                    className="rounded max-h-40 w-auto" data-ai-hint="uploaded media" unoptimized={!!imageToUpload}
                />
                {gifUrl && <p className="text-[10px] text-muted-foreground mt-0.5">via GIPHY</p>}
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive/70 hover:text-destructive" 
                  onClick={removeMedia} title="Remove media" disabled={overallSubmitting}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className={`flex justify-between items-center p-4 ${isModal ? 'pt-2' : 'pt-2 border-t border-border'}`}>
            <div className="flex gap-0">
              {!isRegularSharingMode && !isBlogSharingMode && (
                <>
                  <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Add Image" onClick={handleImageUploadClick} disabled={hasMediaSelected || overallSubmitting}>
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <input type="file" ref={imageInputRef} onChange={handleImageFileChange} accept="image/*" className="hidden" />
                  <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Add GIF" onClick={() => setIsGiphyModalOpen(true)} disabled={hasMediaSelected || overallSubmitting}>
                    <Film className="h-5 w-5" />
                  </Button>
                </>
              )}
              <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Poll (mock)" disabled={overallSubmitting}>
                <BarChart3 className="h-5 w-5" />
              </Button>
              <EmojiPicker 
                onEmojiSelect={handleEmojiSelectForPost} 
                triggerButtonSize="icon" 
                triggerButtonVariant="ghost"
                popoverSide="top"
              />
               <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Schedule (mock)" disabled={overallSubmitting}>
                <CalendarClock className="h-5 w-5" />
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={overallSubmitting || (!form.getValues("content")?.trim() && !imageToUpload && !gifUrl && !isRegularSharingMode && !isBlogSharingMode && !pendingBlogShare) || (!form.formState.isValid && form.formState.isSubmitted)}
              className="font-headline rounded-full px-6"
            >
              {overallSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUploadingToR2 ? "Uploading..." : (isSubmitting ? (isRegularSharingMode ? "Sharing Post..." : (isBlogSharingMode ? "Sharing Blog..." : "Posting...")) : (isRegularSharingMode ? "Share Post" : (isBlogSharingMode ? "Share Blog" : "Post")))}
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

      