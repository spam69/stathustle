"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bell, Search, UserCircle, PlusCircle, LogIn, LogOut, Settings, UserPlus, Menu, PlusSquare, CheckCheck, CircleSlash, RefreshCw, Trash2, X as CloseIcon, Loader2, Users, Repeat } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import type { Notification, Identity as IdentityType } from '@/types';
// import { mockIdentities } from '@/lib/mock-data'; // Removed mockIdentities
import { useQuery } from '@tanstack/react-query';

const NotificationItem = ({
  notification,
  onNotificationClick,
  onDeleteNotification,
  isDeleting,
}: {
  notification: Notification,
  onNotificationClick: (notification: Notification) => void,
  onDeleteNotification: (notificationId: string) => void,
  isDeleting: boolean,
}) => {
  const actorDisplayName = notification.actor.isIdentity ? (notification.actor as any).displayName || notification.actor.username : notification.actor.username;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteNotification(notification.id);
  };

  return (
    <DropdownMenuItem
      className={`flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer relative group ${!notification.isRead ? 'bg-accent/20' : ''}`}
      onClick={() => onNotificationClick(notification)}
      style={{whiteSpace: 'normal', height: 'auto', lineHeight: 'normal'}}
      aria-disabled={isDeleting}
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
        <div className="h-2 w-2 rounded-full bg-primary self-center ml-1 shrink-0" title="Unread"></div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus:opacity-100"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="Delete notification"
      >
        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloseIcon className="h-3.5 w-3.5" />}
      </Button>
    </DropdownMenuItem>
  );
};

const fetchOwnedIdentities = async (userId: string): Promise<IdentityType[]> => {
  const response = await fetch(`/api/identities/owned-by/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch owned identities');
  }
  return response.json();
};


export default function Header() {
  const { 
    user: activePrincipal,
    originalUser,
    logout, 
    loading: authContextLoading,
    switchToIdentity,
    switchToUser 
  } = useAuth(); 
  const { toggleSidebar, isMobile } = useSidebar();
  const { openCreatePostModal } = useFeed();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const {
    displayedNotifications,
    unreadCount,
    markOneAsRead,
    markAllAsRead,
    fetchInitialNotifications,
    deleteNotification,
    isDeletingNotification,
    deleteReadNotifications,
    isDeletingReadNotifications,
    isLoadingInitial,
    isFetchingMore,
    hasMoreNotifications,
    loadMoreNotifications,
    totalServerNotificationsCount,
    openNotificationInModal,
  } = useNotifications();

  useEffect(() => {
    if (activePrincipal && !isLoadingInitial && displayedNotifications.length === 0 && totalServerNotificationsCount === 0) {
      fetchInitialNotifications();
    }
  }, [activePrincipal, fetchInitialNotifications, isLoadingInitial, displayedNotifications.length, totalServerNotificationsCount]);


  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || (name ? name[0]?.toUpperCase() : 'U');
  };

  const handleLogout = () => {
    logout(); 
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchInput = event.currentTarget.elements.namedItem('searchQuery') as HTMLInputElement;
    console.log("Search submitted from modal with value:", searchInput?.value);
    setIsSearchModalOpen(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (isDeletingNotification) return;
    openNotificationInModal(notification);
  };

  const handleMarkAllRead = async () => {
    if (isDeletingReadNotifications || isDeletingNotification) return;
    await markAllAsRead();
  };

  const handleDeleteRead = async () => {
    if (isDeletingReadNotifications || isDeletingNotification) return;
    await deleteReadNotifications();
  };

  const handleRefreshNotifications = () => {
    if (isLoadingInitial || isFetchingMore || isDeletingNotification || isDeletingReadNotifications) return;
    fetchInitialNotifications();
    toast({ title: "Notifications", description: "Refreshing notifications list..."});
  };

  const handleDeleteNotification = async (notificationId: string) => {
     await deleteNotification(notificationId);
  };

  const isIdentityActive = !!originalUser;
  const userForIdentityCheck = originalUser || (activePrincipal && !activePrincipal.isIdentity ? activePrincipal : null);

  const { data: ownedIdentities, isLoading: isLoadingOwnedIdentities } = useQuery<IdentityType[], Error>({
    queryKey: ['ownedIdentities', userForIdentityCheck?.id],
    queryFn: () => userForIdentityCheck ? fetchOwnedIdentities(userForIdentityCheck.id) : Promise.resolve([]),
    enabled: !!userForIdentityCheck, // Only fetch if there's a base user to check ownership for
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-[var(--header-height)] items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
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

        {activePrincipal && (
          <Button variant="ghost" size="icon" onClick={openCreatePostModal} aria-label="Create Post">
            <PlusSquare className="h-5 w-5" />
          </Button>
        )}

        <ThemeSwitcher />

        {activePrincipal && ( 
          <DropdownMenu onOpenChange={(isOpen) => { if (isOpen && !isLoadingInitial && displayedNotifications.length === 0 && totalServerNotificationsCount === 0 && activePrincipal) fetchInitialNotifications() }}>
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
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={handleRefreshNotifications} className="h-7 w-7" disabled={isLoadingInitial || isFetchingMore || isDeletingNotification || isDeletingReadNotifications} title="Refresh notifications">
                     <RefreshCw className={`h-4 w-4 ${isLoadingInitial || isFetchingMore ? 'animate-spin' : ''}`} />
                  </Button>
                  {displayedNotifications.length > 0 && unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-auto p-1" disabled={isDeletingNotification || isDeletingReadNotifications}>
                      <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="max-h-[calc(80vh_-_180px)]">
                {isLoadingInitial && displayedNotifications.length === 0 ? (
                   <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
                ) : !isLoadingInitial && displayedNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <CircleSlash className="mx-auto h-8 w-8 mb-2 text-muted-foreground/50"/>
                    No notifications yet.
                  </div>
                ) : (
                  displayedNotifications.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onNotificationClick={handleNotificationClick}
                      onDeleteNotification={handleDeleteNotification}
                      isDeleting={isDeletingNotification}
                    />
                  ))
                )}
              </ScrollArea>
              {hasMoreNotifications && !isLoadingInitial && displayedNotifications.length > 0 && (
                <div className="p-2 text-center border-t">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={loadMoreNotifications}
                    disabled={isFetchingMore}
                    className="w-full text-primary"
                  >
                    {isFetchingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load More Notifications
                  </Button>
                </div>
              )}
              <DropdownMenuSeparator />
              <div className="p-2 flex justify-end items-center">
                  <Button variant="outline" size="sm" onClick={handleDeleteRead} disabled={isDeletingReadNotifications || isDeletingNotification || displayedNotifications.filter(n => n.isRead).length === 0} className="text-xs">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Read
                  </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {authContextLoading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : activePrincipal ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activePrincipal.profilePictureUrl} alt={activePrincipal.username} />
                  <AvatarFallback>{getInitials(activePrincipal.displayName || activePrincipal.username)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{activePrincipal.displayName || activePrincipal.username}</p>
                  {activePrincipal.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {activePrincipal.email}
                    </p>
                  )}
                  {isIdentityActive && originalUser && (
                    <p className="text-xs leading-none text-muted-foreground italic">
                      Acting as Identity (User: @{originalUser.username})
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {isIdentityActive && originalUser ? (
                <DropdownMenuItem onClick={switchToUser}>
                  <Repeat className="mr-2 h-4 w-4" />
                  Switch to @{originalUser.username}
                </DropdownMenuItem>
              ) : (
                !isLoadingOwnedIdentities && ownedIdentities && ownedIdentities.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Switch to Identity</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {isLoadingOwnedIdentities ? (
                        <DropdownMenuItem disabled>Loading identities...</DropdownMenuItem>
                      ) : (
                        ownedIdentities.map((identity) => (
                          <DropdownMenuItem key={identity.id} onClick={() => switchToIdentity(identity)}>
                            {identity.displayName || identity.username}
                          </DropdownMenuItem>
                        ))
                      )}
                       {ownedIdentities && ownedIdentities.length === 0 && !isLoadingOwnedIdentities && (
                         <DropdownMenuItem disabled>No identities found</DropdownMenuItem>
                       )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )
              )}

              {isMobile && (
                <DropdownMenuItem onClick={openCreatePostModal}>
                  <PlusSquare className="mr-2 h-4 w-4" />
                  Create Post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/profile/${activePrincipal.username}`}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {!isIdentityActive && (
                <DropdownMenuItem asChild>
                <Link href="/settings/identity/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Identity
                  </Link>
                </DropdownMenuItem>
              )}
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
