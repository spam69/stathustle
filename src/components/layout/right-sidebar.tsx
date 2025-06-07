
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { TrendingUp, UserPlus, Search, Users, X } from "lucide-react"; // Added Search, Users, X
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { mockUsers, mockIdentities } from '@/lib/mock-data'; // Import actual user data
import type { User, Identity } from '@/types';
import { useAuth } from '@/contexts/auth-context';

// Trending Topics section removed
// const mockTrendingTopics = [
//   { id: "t1", name: "#FantasyFootballDraft", category: "Football - 12.1k Posts" },
//   { id: "t2", name: "PlayerInjuryUpdates", category: "Sports - 8.7k Posts" },
//   { id: "t3", name: "#NBAPlayoffs", category: "Basketball - 22.5k Posts" },
//   { id: "t4", name: "NewSignings", category: "Sports - 5.2k Posts" },
// ];

// Expanded list for "Who to Follow"
const initialMockWhoToFollow: (User | Identity)[] = [
  // Keeping a few distinct from mockUsers for variety, or we can filter mockUsers later
  { id: "sugg1", username: "ExpertAnalyst", displayName: "Dr. Stats", profilePictureUrl: "https://placehold.co/100x100.png?text=EA", bio: "Top-tier fantasy advice.", isIdentity: false },
  { id: "sugg2", username: "HoopsInsider", displayName: "Hoops Insider", profilePictureUrl: "https://placehold.co/100x100.png?text=HI", bio: "NBA news and rumors.", isIdentity: false },
  { id: "sugg3", username: "GridironGuru", displayName: "Gridiron Guru", profilePictureUrl: "https://placehold.co/100x100.png?text=GG", bio: "Football strategy and tips.", isIdentity: false },
  { id: "sugg4", username: "SoccerSensei", displayName: "Soccer Sensei", profilePictureUrl: "https://placehold.co/100x100.png?text=SS", bio: "Global football insights.", isIdentity: false },
  { id: "sugg5", username: "BaseballBuff", displayName: "Baseball Buff", profilePictureUrl: "https://placehold.co/100x100.png?text=BB", bio: "All things MLB.", isIdentity: false },
  { id: "sugg6", username: "HockeyWhiz", displayName: "Hockey Whiz", profilePictureUrl: "https://placehold.co/100x100.png?text=HW", bio: "Puck drops and analysis.", isIdentity: false },
];

const VISIBLE_SUGGESTIONS_COUNT = 3;

export default function RightSidebar() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<(User | Identity)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllFollowSuggestions, setShowAllFollowSuggestions] = useState(false);

  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

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
            : false;
        return usernameMatch || displayNameMatch;
      });
      setSearchResults(filteredResults);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, currentUser]);

  const displayedFollowSuggestions = showAllFollowSuggestions 
    ? initialMockWhoToFollow 
    : initialMockWhoToFollow.slice(0, VISIBLE_SUGGESTIONS_COUNT);

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
            className="pl-9 pr-8 w-full" // Added pr-8 for clear button
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
              <p className="text-sm text-muted-foreground p-2.5">No users found for "{debouncedSearchTerm}".</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Trending Topics Card Removed */}
          {/*
          <Card className="bg-card/50 shadow-none border-none">
            <CardHeader className="px-2 pt-4 pb-2">
              <CardTitle className="text-lg font-headline flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> Trending Topics</CardTitle>
            </CardHeader>
            <CardContent className="px-2 space-y-1">
              {mockTrendingTopics.map(topic => (
                <Link href="#" key={topic.id} className="block p-2.5 rounded-lg hover:bg-accent/10 transition-colors">
                  <p className="font-semibold text-sm text-foreground">{topic.name}</p>
                  <p className="text-xs text-muted-foreground">{topic.category}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
          */}

          <Card className="bg-card/50 shadow-none border-none">
            <CardHeader className="px-2 pt-4 pb-2">
              <CardTitle className="text-lg font-headline flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary" /> Who to Follow</CardTitle>
            </CardHeader>
            <CardContent className="px-2 space-y-1">
              {displayedFollowSuggestions.map(user => renderProfileItem(user, 'suggestion'))}
              {initialMockWhoToFollow.length > VISIBLE_SUGGESTIONS_COUNT && (
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
