
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { UserPlus, Search, Users, X } from "lucide-react";
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { mockUsers, mockIdentities } from '@/lib/mock-data';
import type { User, Identity } from '@/types';
import { useAuth } from '@/contexts/auth-context';

const VISIBLE_SUGGESTIONS_COUNT = 3;

export default function RightSidebar() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<(User | Identity)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followSuggestions, setFollowSuggestions] = useState<(User | Identity)[]>([]);
  const [showAllFollowSuggestions, setShowAllFollowSuggestions] = useState(false);

  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  useEffect(() => {
    // Prepare follow suggestions
    const allProfiles: (User | Identity)[] = [...mockUsers, ...mockIdentities];
    let potentialSuggestions = allProfiles;

    if (currentUser) {
      potentialSuggestions = potentialSuggestions.filter(profile => profile.id !== currentUser.id);
    }
    // Simple shuffle and take first few for variety, or just take first few
    // For a more robust shuffle: potentialSuggestions.sort(() => 0.5 - Math.random());
    setFollowSuggestions(potentialSuggestions);

  }, [currentUser]);


  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setIsSearching(true);
      const term = debouncedSearchTerm.toLowerCase();
      const allSearchableProfiles: (User | Identity)[] = [...mockUsers, ...mockIdentities];
      
      const filteredResults = allSearchableProfiles.filter(profile => {
        // Exclude current user from search results
        if (currentUser && profile.id === currentUser.id) {
            return false;
        }
        const usernameMatch = profile.username.toLowerCase().includes(term);
        const displayNameMatch = profile.isIdentity && (profile as Identity).displayName 
            ? (profile as Identity).displayName!.toLowerCase().includes(term) 
            : profile.username.toLowerCase().includes(term); // Fallback to username if not an identity or no display name
        return usernameMatch || displayNameMatch;
      });
      setSearchResults(filteredResults);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, currentUser]);

  const displayedFollowSuggestions = showAllFollowSuggestions 
    ? followSuggestions
    : followSuggestions.slice(0, VISIBLE_SUGGESTIONS_COUNT);

  const renderProfileItem = (profile: User | Identity, type: 'suggestion' | 'search') => {
    const displayName = profile.isIdentity ? (profile as Identity).displayName || profile.username : profile.username;
    const profileLink = `/profile/${profile.username}`;

    return (
      <div key={`${type}-${profile.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-accent/10 transition-colors">
        <Link href={profileLink} className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={profile.profilePictureUrl} alt={displayName} data-ai-hint="person avatar"/>
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-foreground hover:underline">{displayName}</p>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </Link>
        <Button variant="outline" size="sm" className="rounded-full text-xs px-3 py-1 h-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground">Follow</Button>
      </div>
    );
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };


  return (
    <aside className="w-80 min-w-[20rem] space-y-6 p-4 pt-0 border-l border-border overflow-y-auto h-full">
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-3 z-10 -mx-4 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search StatHustle..."
            className="pl-9 pr-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {debouncedSearchTerm.trim() ? (
        <Card className="bg-card/50 shadow-none border-none">
          <CardHeader className="px-2 pt-2 pb-2">
            <CardTitle className="text-lg font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Search Results</CardTitle>
          </CardHeader>
          <CardContent className="px-2 space-y-1">
            {isSearching ? (
              <p className="text-sm text-muted-foreground p-2.5">Searching...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map(profile => renderProfileItem(profile, 'search'))
            ) : (
              <p className="text-sm text-muted-foreground p-2.5">No users or identities found for "{debouncedSearchTerm}".</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-card/50 shadow-none border-none">
            <CardHeader className="px-2 pt-4 pb-2">
              <CardTitle className="text-lg font-headline flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary" /> Who to Follow</CardTitle>
            </CardHeader>
            <CardContent className="px-2 space-y-1">
              {displayedFollowSuggestions.length > 0 ? (
                displayedFollowSuggestions.map(user => renderProfileItem(user, 'suggestion'))
              ) : (
                <p className="text-sm text-muted-foreground p-2.5">No new suggestions right now.</p>
              )}
              {followSuggestions.length > VISIBLE_SUGGESTIONS_COUNT && (
                <Button variant="link" className="p-2.5 text-primary text-sm w-full justify-start" onClick={() => setShowAllFollowSuggestions(!showAllFollowSuggestions)}>
                  {showAllFollowSuggestions ? "Show less" : "Show more"}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      <div className="p-2 text-xs text-muted-foreground space-x-2">
        <Link href="#" className="hover:underline">Terms of Service</Link>
        <Link href="#" className="hover:underline">Privacy Policy</Link>
        <Link href="#" className="hover:underline">Cookie Policy</Link>
        <span>&copy; {new Date().getFullYear()} StatHustle</span>
      </div>
    </aside>
  );
}
