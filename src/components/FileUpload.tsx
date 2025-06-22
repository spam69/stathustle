import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types/messaging';

interface FileUploadProps {
  onUpload: (file: File) => void;
  children: React.ReactNode;
}

export function FileUpload({ onUpload, children }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a valid file type (image, document, or video)',
        variant: 'destructive'
      });
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        variant: 'destructive'
      });
      return;
    }

    onUpload(file);
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={ALLOWED_FILE_TYPES.join(',')}
      />
      <div onClick={() => fileInputRef.current?.click()}>{children}</div>
    </>
  );
} 