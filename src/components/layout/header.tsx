
"use client";

import Link from 'next/link';
import { useState } from 'react'; 
import { Bell, Search, UserCircle, LogIn, LogOut, Settings, UserPlus, Menu, MessageSquare, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuth } from '@/contexts/auth-context';
import { useSidebar } from '@/components/ui/sidebar';
import { useFeed } from '@/contexts/feed-context';
import { signOut } from 'next-auth/react'; // Import signOut directly
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface HeaderProps {
  toggleChat: () => void;
}

export default function Header({ toggleChat }: HeaderProps) {
  const { user, loading: authContextLoading } = useAuth(); // Get user from AuthContext
  const { toggleSidebar, isMobile } = useSidebar();
  const { openCreatePostModal } = useFeed();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const currentUser = user; 

  const getInitials = (name: string = "") => { 
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || (name ? name[0]?.toUpperCase() : 'U');
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login', redirect: true }); // Redirect to login after sign out
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
    queryClient.clear(); // Clear react-query cache on logout
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchInput = event.currentTarget.elements.namedItem('searchQuery') as HTMLInputElement;
    console.log("Search submitted from modal with value:", searchInput?.value);
    setIsSearchModalOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      {isMobile && (
         <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
           <Menu className="h-6 w-6" />
           <span className="sr-only">Toggle sidebar</span>
         </Button>
      )}
      <Link href="/" className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
        <span className="font-headline text-lg font-semibold tracking-tight">StatHustle</span>
      </Link>
      
      <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
        <form className="ml-auto hidden sm:flex flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>

        <div className="ml-auto sm:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchModalOpen(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Open search</span>
          </Button>
        </div>

        {currentUser && (
          <Button variant="ghost" size="icon" onClick={openCreatePostModal} aria-label="Create Post">
            <PlusSquare className="h-5 w-5" />
          </Button>
        )}

        <ThemeSwitcher />
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleChat} aria-label="Open Live Support Chat">
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">Live Support</span>
        </Button>

        {authContextLoading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.username} />
                  <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.username}</p>
                  {currentUser.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isMobile && (
                <DropdownMenuItem onClick={openCreatePostModal}>
                  <PlusSquare className="mr-2 h-4 w-4" />
                  Create Post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/profile/${currentUser.username}`}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </Link>
            </Button>
          </div>
        )}
      </div>
      
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Search StatHustle</DialogTitle>
            <DialogDescription>
              Find players, posts, blogs, or users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mt-4">
            <Input
              name="searchQuery"
              type="search"
              placeholder="Search..."
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" aria-label="Submit search">
              <Search className="h-4 w-4" /> 
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
