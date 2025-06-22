import React from 'react';
import { FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode, File, Download } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FilePlaceholderProps {
  fileName: string;
  fileType?: string;
  fileUrl?: string;
  className?: string;
  onClick?: () => void;
}

export function FilePlaceholder({ 
  fileName, 
  fileType, 
  fileUrl, 
  className,
  onClick 
}: FilePlaceholderProps) {
  const getFileIcon = (type?: string) => {
    if (!type) return <File className="h-8 w-8" />;
    
    if (type.startsWith('image/')) return <FileImage className="h-8 w-8" />;
    if (type.startsWith('video/')) return <FileVideo className="h-8 w-8" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-8 w-8" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) return <FileArchive className="h-8 w-8" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8" />;
    if (type.includes('doc') || type.includes('docx')) return <FileText className="h-8 w-8" />;
    if (type.includes('xls') || type.includes('xlsx')) return <FileText className="h-8 w-8" />;
    if (type.includes('ppt') || type.includes('pptx')) return <FileText className="h-8 w-8" />;
    if (type.includes('txt')) return <FileText className="h-8 w-8" />;
    if (type.includes('json') || type.includes('xml') || type.includes('html') || type.includes('css') || type.includes('js')) return <FileCode className="h-8 w-8" />;
    
    return <File className="h-8 w-8" />;
  };

  const getFileExtension = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (fileUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Button
      variant="outline"
      className={cn(
        "w-48 h-48 flex flex-col items-center justify-center space-y-3 p-4 hover:bg-accent transition-colors",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center space-y-2">
        {getFileIcon(fileType)}
        <div className="text-center">
          <div className="text-sm font-medium truncate max-w-32">
            {fileName}
          </div>
          <div className="text-xs text-muted-foreground">
            {getFileExtension(fileName)}
          </div>
        </div>
      </div>
      <Download className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
} 