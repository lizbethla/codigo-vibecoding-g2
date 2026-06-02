'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <div className="w-full max-w-md">
      {/* Mobile logo — hidden on lg where side panel shows */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-700 rounded-xl shadow">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight">Logística</p>
          <p className="text-xs text-muted-foreground">Sistema de gestión</p>
        </div>
      </div>

      <Card className="shadow-xl border border-border/60">
        <CardHeader className="space-y-1 pb-2 pt-8 px-8">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Bienvenido de vuelta
          </CardTitle>
          <CardDescription className="text-sm">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <LoginForm />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        © {new Date().getFullYear()} Logística · Todos los derechos reservados
      </p>
    </div>
  );
}
