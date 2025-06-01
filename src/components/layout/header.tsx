
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bell, Search, UserCircle, LogIn, LogOut, Settings, UserPlus, Menu, MessageSquare, PlusSquare, CheckCheck, CircleSlash } from 'lucide-react';
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
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuth } from '@/contexts/auth-context';
import { useSidebar } from '@/components/ui/sidebar';
import { useFeed } from '@/contexts/feed-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import { useNotifications } from '@/contexts/notification-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types';

interface HeaderProps {
  toggleChat: () => void;
}

const NotificationItem = ({ notification, onNotificationClick }: { notification: Notification, onNotificationClick: (notification: Notification) => void }) => {
  const actorDisplayName = notification.actor.isIdentity ? (notification.actor as any).displayName || notification.actor.username : notification.actor.username;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <DropdownMenuItem
      className={`flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer ${!notification.isRead ? 'bg-accent/20' : ''}`}
      onClick={() => onNotificationClick(notification)}
      style={{whiteSpace: 'normal', height: 'auto', lineHeight: 'normal'}}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={notification.actor.profilePictureUrl} alt={actorDisplayName} data-ai-hint="person avatar"/>
        <AvatarFallback>
          {actorDisplayName?.substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: notification.message }} />
        <p className={`text-xs mt-1 ${!notification.isRead ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <div className="h-2 w-2 rounded-full bg-primary self-center ml-2 shrink-0" title="Unread"></div>
      )}
    </DropdownMenuItem>
  );
};


export default function Header({ toggleChat }: HeaderProps) {
  const { user: currentUser, loading: authContextLoading } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();
  const { openCreatePostModal } = useFeed();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { notifications, unreadCount, markOneAsRead, markAllAsRead, fetchNotifications } = useNotifications();

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(); // Fetch initially when header mounts and user is available
    }
  }, [currentUser, fetchNotifications]);


  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || (name ? name[0]?.toUpperCase() : 'U');
  };

  const handleLogout = async () => {
    toast({ title: "Logout (Dev Mode)", description: "Admin user is always logged in. Refresh to simulate session clear."});
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchInput = event.currentTarget.elements.namedItem('searchQuery') as HTMLInputElement;
    console.log("Search submitted from modal with value:", searchInput?.value);
    setIsSearchModalOpen(false);
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markOneAsRead(notification.id);
    }
    // For now, all notification links go to the post page if postId exists.
    // Or to the actor's profile if no specific content link.
    const defaultLink = `/profile/${notification.actor.username}`;
    let targetLink = notification.link || defaultLink;

    if (notification.postId) {
        const postAuthorUsername = notifications.find(n => n.id === notification.id)?.actor.username || 'unknown'; // simplified
        targetLink = `/blogs/${postAuthorUsername}/${notification.postId}`; // Assuming slug is postId. This needs a robust way to get actual blog slug
        // For actual posts, it would be /profile/username/posts/postId or similar
        // The current link structure in mock-data is simplified.
    }
    
    // A more robust linking strategy is needed here, for now, basic navigation:
    if(notification.link && notification.link.startsWith('/')) {
        router.push(notification.link);
    } else {
        console.warn("Notification link is not a relative path or is missing:", notification.link);
        // Fallback, perhaps to user profile or feed
        router.push(`/profile/${currentUser?.username || ''}`);
    }

  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
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
        
        <DropdownMenu onOpenChange={(isOpen) => isOpen && fetchNotifications()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 min-w-[1rem] p-0.5 text-xs flex items-center justify-center rounded-full"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 sm:w-96 p-0" align="end">
            <div className="flex items-center justify-between p-3 border-b">
              <DropdownMenuLabel className="p-0 font-headline text-base">Notifications</DropdownMenuLabel>
              {notifications.length > 0 && unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-auto p-1">
                  <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <CircleSlash className="mx-auto h-8 w-8 mb-2 text-muted-foreground/50"/>
                  No notifications yet.
                </div>
              ) : (
                notifications.map(notif => (
                  <NotificationItem key={notif.id} notification={notif} onNotificationClick={handleNotificationClick} />
                ))
              )}
            </ScrollArea>
             {notifications.length > 0 && (
                <DropdownMenuItem className="justify-center text-sm text-primary hover:underline p-2 border-t" asChild>
                    <Link href="/notifications">View all notifications</Link>
                </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
                Log out (Dev Mode)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // This block should not be reached in dev mode if admin is always logged in
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
