
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import type { IGif } from '@giphy/js-types';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming you have or will create this hook
import { Loader2 } from 'lucide-react';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '');

interface GiphyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGifSelect: (gif: IGif) => void;
}

// Simple debounce hook (create if not exists)
// hooks/use-debounce.ts
// import { useState, useEffect } from 'react';
// export function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);
//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);
//   return debouncedValue;
// }


export default function GiphyPickerModal({ isOpen, onClose, onGifSelect }: GiphyPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isFetching, setIsFetching] = useState(false);

  const fetchGifs = useCallback(async (offset: number) => {
    setIsFetching(true);
    try {
      if (debouncedSearchTerm) {
        return await gf.search(debouncedSearchTerm, { offset, limit: 12 });
      }
      return await gf.trending({ offset, limit: 12 });
    } catch (error) {
        console.error("Error fetching GIFs:", error);
        return { data: [], pagination: { total_count: 0, count: 0, offset: 0 } };
    } finally {
        setIsFetching(false);
    }
  }, [debouncedSearchTerm]);

  const handleGifClick = (gif: IGif, e: React.SyntheticEvent<HTMLElement, Event>) => {
    e.preventDefault();
    onGifSelect(gif);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Select a GIF</DialogTitle>
          <DialogDescription>
            Search for GIFs from GIPHY.
          </DialogDescription>
        </DialogHeader>
        <div className="p-1 relative">
          <Input
            type="text"
            placeholder="Search GIPHY..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
          />
           {isFetching && <Loader2 className="absolute top-2 right-2 h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex-grow overflow-y-auto pr-1">
          <Grid
            key={debouncedSearchTerm} // Important to re-fetch when search term changes
            fetchGifs={fetchGifs}
            width={550} // Adjust width as needed based on modal size
            columns={3}
            gutter={6}
            onGifClick={handleGifClick}
            hideAttribution // We'll add custom attribution
            noLink
            className="[&>div]:overflow-visible" // Fix potential Giphy Grid overflow issues
          />
        </div>
        <DialogFooter className="pt-4 border-t items-center">
            <span className="text-xs text-muted-foreground">Powered by GIPHY</span>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
