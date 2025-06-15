"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import type { Post } from '@/types';
import Image from 'next/image';
import { X, ImageIcon, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import GiphyPickerModal from './giphy-picker-modal';
import type { IGif } from '@giphy/js-types';
import EmojiPicker from './emoji-picker';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPostModal({ post, isOpen, onClose }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageToUpload, setImageToUpload] = useState<{ file: File, localPreviewUrl: string } | null>(null);
  const [gifUrl, setGifUrl] = useState<string | undefined>(post.mediaType === 'gif' ? post.mediaUrl : undefined);
  const [isGiphyModalOpen, setIsGiphyModalOpen] = useState(false);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
  };

  const handleEmojiSelectForPost = (emoji: string) => {
    setContent(prev => prev + emoji);
    contentTextareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageToUpload && !gifUrl) {
      toast({
        title: "Error",
        description: "Post cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
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

      const response = await axios.put(`/api/posts/${post.id}`, {
        content: content.trim(),
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType
      });

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });

      toast({
        title: "Success",
        description: "Post updated successfully"
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update post",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMediaSelected = !!(imageToUpload || gifUrl);
  const overallSubmitting = isUploadingToR2 || isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            ref={contentTextareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[100px]"
            maxLength={1000}
            disabled={overallSubmitting}
          />
          
          {/* Media Preview */}
          {(imageToUpload?.localPreviewUrl || gifUrl || post.mediaUrl) && (
            <div className="border border-border rounded-md p-2 max-w-xs bg-card/50 relative">
              <p className="text-xs text-muted-foreground mb-1">Attached {imageToUpload ? 'image' : (gifUrl || post.mediaType === 'gif') ? 'GIF' : 'image'}:</p>
              <Image 
                src={imageToUpload ? imageToUpload.localPreviewUrl : (gifUrl || post.mediaUrl)!} 
                alt="Selected media" 
                width={200} 
                height={(gifUrl || post.mediaType === 'gif') ? 120 : 150}
                objectFit={(gifUrl || post.mediaType === 'gif') ? 'contain' : 'cover'}
                className="rounded max-h-40 w-auto" 
                data-ai-hint="uploaded media" 
                unoptimized={!!imageToUpload}
              />
              {(gifUrl || post.mediaType === 'gif') && <p className="text-[10px] text-muted-foreground mt-0.5">via GIPHY</p>}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-1 right-1 h-6 w-6 text-destructive/70 hover:text-destructive" 
                onClick={removeMedia} 
                title="Remove media" 
                disabled={overallSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-0">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-primary hover:bg-primary/10" 
              title="Add Image" 
              onClick={handleImageUploadClick} 
              disabled={hasMediaSelected || overallSubmitting}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <input 
              type="file" 
              ref={imageInputRef} 
              onChange={handleImageFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-primary hover:bg-primary/10" 
              title="Add GIF" 
              onClick={() => setIsGiphyModalOpen(true)} 
              disabled={hasMediaSelected || overallSubmitting}
            >
              <Film className="h-5 w-5" />
            </Button>
            <EmojiPicker 
              onEmojiSelect={handleEmojiSelectForPost} 
              triggerButtonSize="icon" 
              triggerButtonVariant="ghost"
              popoverSide="top"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={overallSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={overallSubmitting || (!content.trim() && !imageToUpload && !gifUrl)}
              className="font-headline rounded-full px-6"
            >
              {overallSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUploadingToR2 ? "Uploading..." : (isSubmitting ? "Saving..." : "Save Changes")}
            </Button>
          </div>
        </div>
      </DialogContent>
      <GiphyPickerModal
        isOpen={isGiphyModalOpen}
        onClose={() => setIsGiphyModalOpen(false)}
        onGifSelect={handleGifSelect}
      />
    </Dialog>
  );
} 