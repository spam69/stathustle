"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Newspaper, Users, BarChart3, SettingsIcon, PlusSquare, CircleUser, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarSeparator,
  SidebarGroupContent,
  SidebarContent,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useFeed } from '@/contexts/feed-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import type { User, Identity } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  authRequired?: boolean;
  exactMatch?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, exactMatch: true },
  { href: '/blogs', label: 'Blogs', icon: Newspaper },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/profile', label: 'Profile', icon: CircleUser, authRequired: true },
];

const bottomNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: SettingsIcon, authRequired: true },
];

// Function to fetch profiles
const fetchAllProfiles = async (): Promise<(User | Identity)[]> => {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch profiles');
  }
  return response.json();
};

export default function SidebarNav() {
  const pathname = usePathname();
  const { user: currentUser } = useAuth();
  const { openCreatePostModal } = useFeed();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<(User | Identity)[]>([]);
  const [followSuggestions, setFollowSuggestions] = useState<(User | Identity)[]>([]);
  const [showAllFollowSuggestions, setShowAllFollowSuggestions] = useState(false);
  const VISIBLE_SUGGESTIONS_COUNT = 3;

  const { data: allProfiles, isLoading: isLoadingProfiles, error: profilesError } = useQuery<(User | Identity)[], Error>({
    queryKey: ['allProfilesSidebar'], // Changed queryKey to avoid conflicts if used elsewhere
    queryFn: fetchAllProfiles,
  });

  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'P';

  useEffect(() => {
    if (allProfiles) {
      let potentialSuggestions = allProfiles;
      if (currentUser) {
        potentialSuggestions = potentialSuggestions.filter(profile => profile.id !== currentUser.id);
      }
      // Simple shuffle or take first few; for a real app, use a better suggestion algorithm
      setFollowSuggestions(potentialSuggestions.sort(() => 0.5 - Math.random()).slice(0, 10));
    }
  }, [allProfiles, currentUser]);

  useEffect(() => {
    if (!allProfiles) return;
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      const filteredResults = allProfiles.filter(profile => {
        if (currentUser && profile.id === currentUser.id) {
          return false;
        }
        const usernameMatch = profile.username.toLowerCase().includes(term);
        const displayNameMatch = profile.isIdentity
          ? ((profile as Identity).displayName || profile.username).toLowerCase().includes(term)
          : profile.username.toLowerCase().includes(term);
        return usernameMatch || displayNameMatch;
      });
      setSearchResults(filteredResults.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, allProfiles, currentUser]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const renderProfileItem = (profile: User | Identity, type: 'suggestion' | 'search') => {
    const displayName = profile.isIdentity ? (profile as Identity).displayName || profile.username : profile.username;
    const profileLink = `/profile/${profile.username}`;

    return (
      <div key={`${type}-${profile.id}`} className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-sidebar-accent/60 transition-colors">
        <Link href={profileLink} className="flex items-center gap-2 overflow-hidden">
          <Avatar className="h-8 w-8 border border-sidebar-border">
            <AvatarImage src={profile.profilePictureUrl} alt={displayName} />
            <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-medium text-xs text-sidebar-foreground truncate hover:underline">{displayName}</p>
            <p className="text-[10px] text-sidebar-foreground/70 truncate">@{profile.username}</p>
          </div>
        </Link>
        <Button variant="outline" size="xs" className="rounded-full text-[10px] px-2 py-0.5 h-auto border-sidebar-primary text-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground shrink-0">
          Follow
        </Button>
      </div>
    );
  };

  const displayedFollowSuggestions = showAllFollowSuggestions
    ? followSuggestions
    : followSuggestions.slice(0, VISIBLE_SUGGESTIONS_COUNT);

  const renderNavItem = (item: NavItem, isSubItem = false) => {
    if (item.authRequired && !currentUser) {
      return null;
    }
    let href = item.href;
    if (item.href === '/profile' && currentUser) {
      href = `/profile/${currentUser.username}`;
    }
    const isActive = item.exactMatch ? pathname === href : pathname.startsWith(href);
    const ButtonComponent = isSubItem ? SidebarMenuSubButton : SidebarMenuButton;

    return (
      <SidebarMenuItem key={item.label}>
        <Link href={href} passHref legacyBehavior>
          <ButtonComponent
            isActive={isActive}
            tooltip={{ children: item.label, className: 'font-headline' }}
            aria-current={isActive ? 'page' : undefined}
            className="text-base py-3 h-auto group-data-[collapsible=icon]:justify-center"
          >
            <item.icon className={cn("h-6 w-6", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/80")} />
            <span className={cn("font-headline group-data-[collapsible=icon]:hidden", isActive ? "font-semibold" : "font-normal")}>{item.label}</span>
          </ButtonComponent>
        </Link>
        {item.subItems && item.subItems.length > 0 && (
          <SidebarMenuSub>
            {item.subItems.map(subItem => (
              <SidebarMenuSubItem key={subItem.href}>
                {renderNavItem(subItem, true)}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarHeader className="group-data-[collapsible=icon]:hidden !p-2 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/60" />
          <Input
            type="search"
            placeholder="Search StatHustle..."
            className="pl-8 pr-8 h-8 text-xs bg-sidebar-background focus:bg-sidebar-background/90 border-sidebar-border focus-visible:ring-sidebar-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={handleClearSearch}
            >
              <X className="h-3.5 w-3.5 text-sidebar-foreground/60" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        {debouncedSearchTerm.trim() && (
          <SidebarGroup className="pt-0 pb-1 px-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="text-xs !h-auto !py-1 !px-1 text-sidebar-foreground/80">Search Results</SidebarGroupLabel>
            <SidebarGroupContent className="space-y-0.5">
              {isLoadingProfiles ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={`search-skel-${i}`} className="h-10 w-full rounded-md bg-sidebar-accent/30" />)
              ) : searchResults.length > 0 ? (
                searchResults.map(profile => renderProfileItem(profile, 'search'))
              ) : (
                <p className="text-xs text-sidebar-foreground/70 p-1.5">No results for "{debouncedSearchTerm}".</p>
              )}
              {profilesError && <p className="text-xs text-destructive p-1.5">Error loading search results.</p>}
            </SidebarGroupContent>
             <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden"/>
          </SidebarGroup>
        )}

        <SidebarGroup className="p-2 pt-0">
          <SidebarMenu className="gap-1">
            {navItems.map(item => renderNavItem(item))}
          </SidebarMenu>
        </SidebarGroup>

        {!debouncedSearchTerm.trim() && (
          <>
            <SidebarSeparator className="my-1 group-data-[collapsible=icon]:hidden"/>
            <SidebarGroup className="pt-1 pb-1 px-2 group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="text-xs !h-auto !py-1 !px-1 text-sidebar-foreground/80">Who to Follow</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-0.5">
                {isLoadingProfiles ? (
                  Array.from({ length: VISIBLE_SUGGESTIONS_COUNT }).map((_, i) => <Skeleton key={`follow-skel-${i}`} className="h-10 w-full rounded-md bg-sidebar-accent/30" />)
                ) : profilesError ? (
                  <p className="text-xs text-destructive p-1.5">Error loading suggestions.</p>
                ) : displayedFollowSuggestions.length > 0 ? (
                  displayedFollowSuggestions.map(user => renderProfileItem(user, 'suggestion'))
                ) : (
                  <p className="text-xs text-sidebar-foreground/70 p-1.5">No new suggestions.</p>
                )}
                {!isLoadingProfiles && !profilesError && followSuggestions.length > VISIBLE_SUGGESTIONS_COUNT && (
                  <Button variant="link" className="p-1.5 text-sidebar-primary text-xs w-full justify-start h-auto hover:no-underline" onClick={() => setShowAllFollowSuggestions(!showAllFollowSuggestions)}>
                    {showAllFollowSuggestions ? "Show less" : "Show more"}
                  </Button>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <div className="mt-auto border-t border-sidebar-border">
        {currentUser && (
        <div className="p-3 group-data-[collapsible=icon]:p-2">
          <Button
            variant="default"
            className="w-full font-headline bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0"
            onClick={openCreatePostModal}
            disabled={!currentUser}
            title="Create Post"
          >
            <PlusSquare className="h-5 w-5 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:mr-0 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Post</span>
          </Button>
        </div>
        )}
        <SidebarGroup className="p-2 pt-0">
          <SidebarMenu className="gap-1">
            {bottomNavItems.map(item => renderNavItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </>
  );
}
