"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import type { IGif } from '@giphy/js-types';
import { useDebounce } from '@/hooks/use-debounce';
import { Loader2, AlertTriangle } from 'lucide-react';

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
let gf: GiphyFetch | null = null;

if (GIPHY_API_KEY) {
  gf = new GiphyFetch(GIPHY_API_KEY);
} else {
  console.warn("Giphy API Key (NEXT_PUBLIC_GIPHY_API_KEY) is not configured. Giphy Picker will be disabled.");
}

interface GiphyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGifSelect: (gif: IGif) => void;
}

export default function GiphyPickerModal({ isOpen, onClose, onGifSelect }: GiphyPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isFetching, setIsFetching] = useState(false);

  const fetchGifs = useCallback(async (offset: number) => {
    if (!gf) {
      return { data: [], pagination: { total_count: 0, count: 0, offset: 0 } };
    }
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
            {gf ? "Search for GIFs from GIPHY." : "Giphy integration is not configured."}
          </DialogDescription>
        </DialogHeader>
        
        {!gf ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold">Giphy Not Available</p>
            <p className="text-muted-foreground text-sm">
              Please ensure <code>NEXT_PUBLIC_GIPHY_API_KEY</code> is set in your environment variables.
            </p>
          </div>
        ) : (
          <>
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
                width={window.innerWidth > 768 ? 550 : window.innerWidth - 64} // Responsive width based on screen size
                columns={3}
                gutter={6}
                onGifClick={handleGifClick}
                hideAttribution 
                noLink
                className="[&>div]:overflow-visible [&_img]:!w-full [&_img]:!h-auto [&_img]:!object-contain" 
              />
            </div>
          </>
        )}
        
        <DialogFooter className="pt-4 border-t items-center">
            {gf && <span className="text-xs text-muted-foreground mr-auto">Powered by GIPHY</span>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
