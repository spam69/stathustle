
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Newspaper, Users, BarChart3, SettingsIcon, PlusSquare, CircleUser } from 'lucide-react'; // Added CircleUser
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useFeed } from '@/contexts/feed-context'; // For Create Post Modal
import { Button } from '@/components/ui/button'; // For the new Post button

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  authRequired?: boolean;
  exactMatch?: boolean; // For Home/Feed to not match /blogs etc.
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, exactMatch: true },
  { href: '/blogs', label: 'Blogs', icon: Newspaper },
  { 
    href: '/players', 
    label: 'Players', 
    icon: Users,
  },
  // { href: '/analytics', label: 'Analytics', icon: BarChart3, authRequired: true },
  { href: '/profile', label: 'Profile', icon: CircleUser, authRequired: true }, // Placeholder, will be dynamic
];

const bottomNavItems: NavItem[] = [
    { href: '/settings', label: 'Settings', icon: SettingsIcon, authRequired: true },
];


export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openCreatePostModal } = useFeed();

  const renderNavItem = (item: NavItem, isSubItem = false) => {
    if (item.authRequired && !user) {
      return null;
    }

    let href = item.href;
    if (item.href === '/profile' && user) {
        href = `/profile/${user.username}`; // Make profile link dynamic
    }


    const isActive = item.exactMatch ? pathname === href : pathname.startsWith(href);
    const ButtonComponent = isSubItem ? SidebarMenuSubButton : SidebarMenuButton;
    
    return (
      <SidebarMenuItem key={item.label}> {/* Changed key to item.label for stability with dynamic href */}
        <Link href={href} passHref legacyBehavior>
          <ButtonComponent
            isActive={isActive}
            tooltip={{ children: item.label, className: 'font-headline' }}
            aria-current={isActive ? 'page' : undefined}
            className="text-base py-3 h-auto group-data-[collapsible=icon]:justify-center" // Larger text, taller button
          >
            <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-sidebar-foreground/80")} />
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
      <SidebarGroup className="p-2">
        {/* <SidebarGroupLabel className="font-headline text-sm mb-2 group-data-[collapsible=icon]:hidden">Menu</SidebarGroupLabel> */}
        <SidebarMenu className="gap-1">
          {navItems.map(item => renderNavItem(item))}
        </SidebarMenu>
      </SidebarGroup>
      
      {user && (
        <SidebarGroup className="px-2 py-4 group-data-[collapsible=icon]:px-1">
            <Button 
                variant="default" 
                className="w-full h-12 rounded-full font-headline text-lg group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-0"
                onClick={() => openCreatePostModal()}
            >
                <PlusSquare className="h-6 w-6 group-data-[collapsible=expanded]:mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Post</span>
            </Button>
        </SidebarGroup>
      )}
      
      <div className="mt-auto">
        <SidebarGroup className="p-2">
          <SidebarMenu className="gap-1">
            {bottomNavItems.map(item => renderNavItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </>
  );
}
