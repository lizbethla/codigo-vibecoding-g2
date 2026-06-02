'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RouteInfoCard } from '@/components/routes/route-info-card';
import { StopsTable } from '@/components/routes/stops-table';
import { RouteSheet } from '@/components/routes/route-sheet';
import { StopSheet } from '@/components/routes/stop-sheet';
import { StopDeleteDialog } from '@/components/routes/stop-delete-dialog';
import { useRoute } from '@/hooks/use-routes';
import type { RouteStop } from '@/docs/schemas';

interface RouteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const routeId = parseInt(id, 10);

  const { data: route, isLoading, isError } = useRoute(routeId);

  // Route edit sheet state
  const [routeSheetOpen, setRouteSheetOpen] = useState(false);

  // Stop sheet state
  const [stopSheetOpen, setStopSheetOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<RouteStop | undefined>(undefined);

  // Stop delete dialog state
  const [stopDeleteDialogOpen, setStopDeleteDialogOpen] = useState(false);
  const [stopToDelete, setStopToDelete] = useState<RouteStop | null>(null);

  function handleEditStop(stop: RouteStop) {
    setSelectedStop(stop);
    setStopSheetOpen(true);
  }

  function handleDeleteStop(stop: RouteStop) {
    setStopToDelete(stop);
    setStopDeleteDialogOpen(true);
  }

  function handleStopSheetOpenChange(open: boolean) {
    setStopSheetOpen(open);
    if (!open) {
      setSelectedStop(undefined);
    }
  }

  function handleStopDeleteDialogOpenChange(open: boolean) {
    setStopDeleteDialogOpen(open);
    if (!open) {
      setStopToDelete(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Cargando...
        </div>
      </div>
    );
  }

  if (isError || !route) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Error al cargar la ruta. Intenta de nuevo.
        </div>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => router.push('/routes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a rutas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/routes')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a rutas
        </Button>
      </div>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{route.name}</h1>
      </div>

      {/* Route info card */}
      <RouteInfoCard route={route} onEdit={() => setRouteSheetOpen(true)} />

      {/* Stops section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Paradas</h2>
          <Button
            size="sm"
            onClick={() => {
              setSelectedStop(undefined);
              setStopSheetOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar parada
          </Button>
        </div>

        <StopsTable
          stops={route.stops}
          onEdit={handleEditStop}
          onDelete={handleDeleteStop}
        />
      </div>

      {/* Route edit sheet */}
      <RouteSheet
        open={routeSheetOpen}
        onOpenChange={setRouteSheetOpen}
        routeId={routeId}
      />

      {/* Stop sheet */}
      <StopSheet
        open={stopSheetOpen}
        onOpenChange={handleStopSheetOpenChange}
        routeId={routeId}
        stop={selectedStop}
      />

      {/* Stop delete dialog */}
      <StopDeleteDialog
        stopName={stopToDelete?.stop_name ?? ''}
        routeId={routeId}
        stopId={stopToDelete?.id ?? null}
        open={stopDeleteDialogOpen}
        onOpenChange={handleStopDeleteDialogOpenChange}
      />
    </div>
  );
}
