'use client';

import Link from 'next/link';
import { Menu, UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth.store';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white border-b border-neutral-200 shrink-0">

      {/* Left: hamburger (mobile only) */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </div>

      {/* Right: profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full !bg-slate-600 hover:!bg-slate-700 p-0 shrink-0 transition-colors"
          >
            <span className="text-xs font-bold text-white select-none">
              {initials}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal py-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.username ?? 'Usuario'}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" />
              Ver perfil
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={logout}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
