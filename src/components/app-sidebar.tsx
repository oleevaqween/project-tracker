'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon,
  FolderKanbanIcon,
  CheckSquareIcon,
  BookOpenIcon,
  BotIcon,
  BarChart3Icon,
  BriefcaseIcon,
  LayersIcon,
  Settings2Icon,
} from 'lucide-react';
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

const NAV_GROUPS: { label: string; items: { title: string; href: string; icon: React.ElementType; exact?: boolean }[] }[] = [
  {
    label: 'Enterprise',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon, exact: true },
    ],
  },
  {
    label: 'Portfolio Management',
    items: [
      { title: 'Portfolios', href: '/portfolios', icon: BriefcaseIcon    },
      { title: 'Programs',   href: '/programs',   icon: LayersIcon       },
      { title: 'Projects',   href: '/projects',   icon: FolderKanbanIcon },
    ],
  },
  {
    label: 'Execution',
    items: [
      { title: 'Tasks',     href: '/tasks',     icon: CheckSquareIcon },
      { title: 'Analytics', href: '/analytics', icon: BarChart3Icon   },
    ],
  },
  {
    label: 'Knowledge & AI',
    items: [
      { title: 'Knowledge Base', href: '/knowledge-base', icon: BookOpenIcon },
      { title: 'Chat',           href: '/ai-chat',        icon: BotIcon      },
    ],
  },
];

// Tracks hover/press on the whole menu item and drives the icon animation
function NavItem({
  href, icon: Icon, title, isActive,
}: {
  href: string; icon: React.ElementType; title: string; isActive: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  return (
    <SidebarMenuItem
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={isActive}
        tooltip={title}
      >
        <motion.span
          className="flex items-center justify-center"
          animate={{
            scale: pressed ? 0.82 : hovered ? 1.18 : 1,
            rotate: pressed ? 0 : hovered && !isActive ? 6 : 0,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          <Icon />
        </motion.span>
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [logoHovered, setLogoHovered] = React.useState(false);
  const [logoPressed, setLogoPressed] = React.useState(false);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => { setLogoHovered(false); setLogoPressed(false); }}
            onMouseDown={() => setLogoPressed(true)}
            onMouseUp={() => setLogoPressed(false)}
          >
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <motion.div
                className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden"
                animate={{
                  scale: logoPressed ? 0.88 : logoHovered ? 1.12 : 1,
                  rotate: logoPressed ? 0 : logoHovered ? 10 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Image
                  src="/logo2.png"
                  width={32}
                  height={32}
                  alt="Project Tracker"
                />
              </motion.div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Project Tracker</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    title={item.title}
                    isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <NavItem
            href="/settings"
            icon={Settings2Icon}
            title="Settings"
            isActive={pathname.startsWith('/settings')}
          />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
