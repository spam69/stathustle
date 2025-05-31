"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Newspaper, Users, BarChart3, SettingsIcon } from 'lucide-react';
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

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  authRequired?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/blogs', label: 'Blogs', icon: Newspaper },
  { 
    href: '/players', 
    label: 'Players', 
    icon: Users,
    // Example of sub-menu, can be expanded
    // subItems: [
    //   { href: '/players/basketball', label: 'Basketball', icon: Users },
    //   { href: '/players/football', label: 'Football', icon: Users },
    // ] 
  },
  // { href: '/analytics', label: 'Analytics', icon: BarChart3, authRequired: true },
];

const bottomNavItems: NavItem[] = [
    { href: '/settings', label: 'Settings', icon: SettingsIcon, authRequired: true },
];


export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const renderNavItem = (item: NavItem, isSubItem = false) => {
    if (item.authRequired && !user) {
      return null;
    }

    const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
    const ButtonComponent = isSubItem ? SidebarMenuSubButton : SidebarMenuButton;
    
    return (
      <SidebarMenuItem key={item.href}>
        <Link href={item.href} passHref legacyBehavior>
          <ButtonComponent
            isActive={isActive}
            tooltip={{ children: item.label, className: 'font-headline' }}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-sidebar-foreground/70")} />
            <span className="font-headline">{item.label}</span>
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
      <SidebarGroup>
        <SidebarGroupLabel className="font-headline">Menu</SidebarGroupLabel>
        <SidebarMenu>
          {navItems.map(item => renderNavItem(item))}
        </SidebarMenu>
      </SidebarGroup>
      
      <div className="mt-auto">
        <SidebarGroup>
          <SidebarMenu>
            {bottomNavItems.map(item => renderNavItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </>
  );
}
