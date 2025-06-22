import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/useDebounce';
import Image from 'next/image';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const searchGifs = async () => {
      if (!debouncedSearch) {
        setGifs([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/giphy/search?q=${encodeURIComponent(debouncedSearch)}`
        );
        if (!response.ok) throw new Error('Failed to fetch GIFs');
        const data = await response.json();
        setGifs(data.data);
      } catch (error) {
        console.error('Failed to search GIFs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchGifs();
  }, [debouncedSearch]);

  return (
    <div className="border rounded-lg bg-background">
      <div className="p-2">
        <Input
          placeholder="Search GIFs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-2 gap-2 p-2">
          {isLoading ? (
            <div className="col-span-2 text-center py-4">Loading...</div>
          ) : gifs.length === 0 ? (
            <div className="col-span-2 text-center py-4 text-muted-foreground">
              {searchQuery ? 'No GIFs found' : 'Search for GIFs'}
            </div>
          ) : (
            gifs.map((gif) => (
              <div
                key={gif.id}
                className="relative aspect-video cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onSelect(gif.images.original.url)}
              >
                <Image
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 