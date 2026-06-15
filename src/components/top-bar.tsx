'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, LogOutIcon, ChevronDownIcon, UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';

export function TopBar({ username }: { username: string }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const initial = username ? username[0].toUpperCase() : 'U';

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Toggle theme"
      >
        <SunIcon className="size-4 dark:hidden" />
        <MoonIcon className="size-4 hidden dark:block" />
      </button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted transition-colors outline-none">
          <Avatar className="size-6 rounded-md shrink-0">
            <AvatarFallback className="rounded-md text-[11px] bg-primary text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[120px] truncate">@{username}</span>
          <ChevronDownIcon className="size-3 text-muted-foreground hidden sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[160px]">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className="size-7 rounded-md shrink-0">
              <AvatarFallback className="rounded-md text-xs bg-primary text-primary-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">@{username}</span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <UserIcon className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} variant="destructive">
            <LogOutIcon className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
