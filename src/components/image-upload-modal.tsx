
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, X as CloseIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleImageFileChange, uploadImageToR2, resetImageState, type ImageFileState } from '@/lib/image-upload-utils';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (newImageUrl: string, imageType: 'profile' | 'banner') => void;
  imageType: 'profile' | 'banner';
  currentImageUrl?: string | null;
  profileUsername?: string; // For alt text
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onImageUploaded,
  imageType,
  currentImageUrl,
  profileUsername = "User"
}: ImageUploadModalProps) {
  const [imageState, setImageState] = useState<ImageFileState>({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state when modal opens or imageType changes, preserving current image if no new selection
    if (isOpen) {
        setImageState({ file: null, previewUrl: currentImageUrl || null, isUploading: false, uploadedUrl: currentImageUrl || null });
    }
  }, [isOpen, currentImageUrl, imageType]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageFileChange(event, setImageState);
  };

  const handleSave = async () => {
    if (!imageState.file && imageState.uploadedUrl) { 
        // No new file selected, but there was an initial image (or already uploaded one from a previous attempt in this modal session)
        // If uploadedUrl is the same as currentImageUrl, effectively no change.
        // Or, if user cleared an image and wants to save "no image" (null), that's handled by setting uploadedUrl to null
        if (imageState.uploadedUrl !== currentImageUrl) {
            onImageUploaded(imageState.uploadedUrl!, imageType); // Pass existing/cleared URL
        }
        onClose();
        return;
    }
    
    if (imageState.file) {
        const uploadedUrl = await uploadImageToR2(imageState, setImageState);
        if (uploadedUrl) {
            onImageUploaded(uploadedUrl, imageType);
            onClose();
        } else {
            // Error toast is handled by uploadImageToR2
        }
    } else {
        // No file selected and no existing uploadedUrl, means user wants to remove image
        onImageUploaded("", imageType); // Pass empty string to signify removal
        onClose();
    }
  };
  
  const handleRemoveImage = () => {
    resetImageState(setImageState);
    // To signify removal, we set uploadedUrl to an empty string.
    // The previewUrl can be set to null to clear the preview.
    setImageState(prev => ({...prev, previewUrl: null, uploadedUrl: ""})); 
  };

  const displayPreviewUrl = imageState.previewUrl;
  const title = imageType === 'profile' ? 'Profile Picture' : 'Banner Image';
  const aspectRatio = imageType === 'profile' ? 'aspect-square' : 'aspect-[16/9]';
  const placeholderHint = imageType === 'profile' ? 'profile picture' : 'banner image';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Update {title}</DialogTitle>
          <DialogDescription>
            Choose a new image for your {imageType}. Max 5MB.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className={`relative w-full ${aspectRatio} rounded-md overflow-hidden border bg-muted flex items-center justify-center`}>
            {displayPreviewUrl ? (
              <Image
                src={displayPreviewUrl}
                alt={`${profileUsername}'s ${title} preview`}
                layout="fill"
                objectFit={imageType === 'profile' ? 'cover' : 'contain'} // contain for banner to see full image
                data-ai-hint={placeholderHint}
              />
            ) : (
                 <ImageIcon className="h-24 w-24 text-muted-foreground" />
            )}
          </div>
          
          {imageState.isUploading && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={imageState.isUploading}>
              <UploadCloud className="mr-2 h-4 w-4" /> {imageState.file || displayPreviewUrl ? "Change" : "Upload Image"}
            </Button>
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
            {(imageState.file || displayPreviewUrl) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage} className="text-destructive hover:text-destructive/80" disabled={imageState.isUploading}>
                <CloseIcon className="mr-2 h-4 w-4" /> Remove
              </Button>
            )}
          </div>
          {imageState.file && <p className="text-xs text-muted-foreground text-center mt-1">Selected: {imageState.file.name}</p>}

        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={imageState.isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={imageState.isUploading || (!imageState.file && imageState.previewUrl === currentImageUrl && imageState.uploadedUrl === currentImageUrl) }>
            {imageState.isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
