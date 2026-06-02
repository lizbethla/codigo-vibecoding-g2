'use client';

import { Mail, User, ShieldCheck, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth.store';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-neutral-100 text-neutral-500 shrink-0 mt-0.5">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-all">
          {value ?? <span className="text-muted-foreground italic">No especificado</span>}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Información de tu cuenta
        </p>
      </div>

      {/* Avatar + name card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-neutral-900 text-neutral-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold">{initials}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {user?.username ?? 'Usuario'}
              </h2>
              {user?.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
              <Badge variant="secondary" className="mt-2 text-xs">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Sesión activa
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">
            Detalles de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow
            icon={User}
            label="Nombre de usuario"
            value={user?.username}
          />
          <InfoRow
            icon={Mail}
            label="Correo electrónico"
            value={user?.email}
          />
          <InfoRow
            icon={CalendarDays}
            label="Estado"
            value="Activo"
          />
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-xs text-muted-foreground">
        Para actualizar tu información, contacta al administrador del sistema.
      </p>
    </div>
  );
}
