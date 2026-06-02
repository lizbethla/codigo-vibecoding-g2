'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IS_ACTIVE_BADGE_CLASSES } from './routes-columns';
import type { Route } from '@/docs/schemas';

interface RouteInfoCardProps {
  route: Route;
  onEdit: () => void;
}

export function RouteInfoCard({ route, onEdit }: RouteInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">{route.code}</span>
              <Badge
                variant="outline"
                className={IS_ACTIVE_BADGE_CLASSES[String(route.is_active)]}
              >
                {route.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <CardTitle className="text-xl">{route.name}</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar ruta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground font-medium">Origen</dt>
            <dd className="mt-1">{route.origin_city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Destino</dt>
            <dd className="mt-1">{route.destination_city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Distancia</dt>
            <dd className="mt-1">
              {route.distance_km
                ? `${parseFloat(route.distance_km).toFixed(2)} km`
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Tiempo estimado</dt>
            <dd className="mt-1">
              {route.estimated_hours
                ? `${route.estimated_hours} h`
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
