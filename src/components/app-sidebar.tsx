'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboardIcon,
  FolderKanbanIcon,
  CheckSquareIcon,
  BookOpenIcon,
  BotIcon,
  BarChart3Icon,
  BriefcaseIcon,
  Settings2Icon,
  GlobeIcon,
  SunIcon,
  MoonIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboardIcon,
  },
  {
    title: 'Portfolios',
    href: '/portfolios',
    icon: BriefcaseIcon,
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderKanbanIcon,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: CheckSquareIcon,
  },
  {
    title: 'Knowledge Base',
    href: '/knowledge-base',
    icon: BookOpenIcon,
  },
  {
    title: 'AI Chat',
    href: '/ai-chat',
    icon: BotIcon,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3Icon,
  },
];

export function AppSidebar({ username, ...props }: React.ComponentProps<typeof Sidebar> & { username?: string }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GlobeIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Project Tracker</span>
                </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={
                      item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/settings" />} isActive={pathname.startsWith('/settings')} tooltip="Settings">
                <Settings2Icon />
                <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-center"
              tooltip="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <SunIcon className="size-4 dark:hidden" />
              <MoonIcon className="size-4 hidden dark:block" />
              <span className="sr-only">Toggle theme</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser username={username ?? ''} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
