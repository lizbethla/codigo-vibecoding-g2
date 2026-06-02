'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Package,
  PackageOpen,
  Route,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/suppliers', label: 'Proveedores', icon: Building2 },
  { href: '/warehouses', label: 'Almacenes', icon: Warehouse },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/drivers', label: 'Conductores', icon: UserCheck },
  { href: '/vehicles', label: 'Vehículos', icon: Truck },
  { href: '/routes', label: 'Rutas', icon: Route },
  { href: '/shipments', label: 'Envíos', icon: PackageOpen },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  function handleLogout() {
    useAuthStore.getState().logout();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-neutral-950 text-neutral-100 shrink-0 transition-transform duration-200',
          'lg:static lg:translate-x-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg shrink-0">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">Logística</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-neutral-500 hover:text-neutral-100 p-1 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
