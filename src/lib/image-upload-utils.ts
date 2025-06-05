
"use client";

import { toast } from '@/hooks/use-toast';

export interface ImageFileState {
  file: File | null;
  previewUrl: string | null; // Local base64 preview
  isUploading?: boolean;
  uploadedUrl?: string | null; // URL from R2 after successful upload
}

export const handleImageFileChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setImageState: React.Dispatch<React.SetStateAction<ImageFileState>>,
  maxSizeMB: number = 5
): void => {
  const file = event.target.files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      if (event.target) event.target.value = ''; 
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({ title: "File Too Large", description: `Image size cannot exceed ${maxSizeMB}MB.`, variant: "destructive" });
      if (event.target) event.target.value = ''; 
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageState({ file, previewUrl: reader.result as string, isUploading: false, uploadedUrl: null });
      // toast({ title: "Image Selected", description: `${file.name} is ready for upload.` });
    };
    reader.onerror = () => {
      toast({ title: "Error Reading File", description: "Could not read the selected image.", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  }
  if (event.target) event.target.value = ''; 
};

export const uploadImageToR2 = async (
  imageFileState: ImageFileState,
  setImageFileState: React.Dispatch<React.SetStateAction<ImageFileState>>
): Promise<string | null> => {
  if (!imageFileState.file) {
    // If there's an already uploaded URL (meaning user didn't change the image but it was from a previous successful upload in this session), return it.
    // Or if the user cleared it and then re-selected the same one that was previously uploaded.
    if (imageFileState.uploadedUrl) return imageFileState.uploadedUrl;
    return null;
  }

  setImageFileState(prev => ({ ...prev, isUploading: true }));

  return new Promise((resolve) => { // Removed reject to handle errors via toast and returning null
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64DataUri = reader.result as string;
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64DataUri,
            fileName: imageFileState.file!.name,
            fileType: imageFileState.file!.type,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Upload to R2 failed');
        }
        console.log("R2 Upload Successful. Public URL (from util):", result.url);
        toast({ title: "Upload Successful", description: `${imageFileState.file!.name} uploaded.` });
        setImageFileState(prev => ({ ...prev, isUploading: false, uploadedUrl: result.url, file: null /* Clear file after upload */ }));
        resolve(result.url);
      } catch (error: any) {
        console.error("R2 Upload error (from util):", error);
        toast({ title: "Upload Failed", description: error.message || `Could not upload ${imageFileState.file?.name}.`, variant: "destructive" });
        setImageFileState(prev => ({ ...prev, isUploading: false }));
        resolve(null); // Resolve with null on error
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error (from util):", error);
      toast({ title: "File Error", description: "Failed to read file for upload.", variant: "destructive" });
      setImageFileState(prev => ({ ...prev, isUploading: false }));
      resolve(null); // Resolve with null on error
    };
    reader.readAsDataURL(imageFileState.file);
  });
};

export const resetImageState = (
  setImageState: React.Dispatch<React.SetStateAction<ImageFileState>>
) => {
  setImageState({ file: null, previewUrl: null, isUploading: false, uploadedUrl: null });
};
