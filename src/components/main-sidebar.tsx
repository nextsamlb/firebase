
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppLogo } from './app-logo';
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  History,
  Shield,
  Gavel,
  ImageIcon,
  Trophy,
  Database,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { useTranslation } from '@/context/language-provider';

export function MainSidebar() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const sidebarLinks = [
    { href: "/stats-central", icon: BarChart3, label: t('statsCentral') },
    { href: "/team-analysis", icon: Trophy, label: t('teamAnalysis') },
    { href: "/competitions", icon: Trophy, label: t('competitions') },
    { href: "/media-hub", icon: ImageIcon, label: t('mediaHub') },
    { href: "/hall-of-fame", icon: History, label: t('history') },
    { href: "/rules", icon: Gavel, label: t('rules') },
    { href: "/inbox", icon: Inbox, label: t('inbox') },
  ];

  if (user?.role === 'admin') {
    sidebarLinks.push({ href: "/admin", icon: Shield, label: t('admin') });
  }

  return (
    <Sidebar
      className="border-e hidden md:flex"
      collapsible="icon"
      variant="sidebar"
      side={language === 'ar' ? 'right' : 'left'}
    >
      <SidebarHeader>
        <div className="flex w-full items-center justify-between">
          {!isCollapsed && <AppLogo />}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
            {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {sidebarLinks.map(({ href, icon: Icon, label }) => (
            <SidebarMenuItem key={href}>
              <Link href={href} passHref>
                <SidebarMenuButton asChild isActive={pathname.startsWith(href)} tooltip={{ children: label }}>
                  <div>
                    <Icon />
                    <span>{label}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {isCollapsed ? null : (
            <div className="p-2">
                 <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} PIFA League</p>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
