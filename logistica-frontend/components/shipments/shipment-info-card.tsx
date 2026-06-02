'use client';

import { Pencil, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PRIORITY_LABELS,
  PRIORITY_BADGE_CLASSES,
} from './shipments-columns';
import type { Shipment } from '@/docs/schemas';

interface ShipmentInfoCardProps {
  shipment: Shipment;
  onEdit: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE');
}

function formatDateTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('es-PE');
}

function formatCurrency(decStr: string): string {
  return `S/ ${parseFloat(decStr).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

export function ShipmentInfoCard({ shipment, onEdit }: ShipmentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">
                {shipment.tracking_code}
              </span>
              <Badge
                variant="outline"
                className={STATUS_BADGE_CLASSES[shipment.status]}
              >
                {STATUS_LABELS[shipment.status]}
              </Badge>
              <Badge
                variant="outline"
                className={PRIORITY_BADGE_CLASSES[shipment.priority]}
              >
                {PRIORITY_LABELS[shipment.priority]}
              </Badge>
            </div>
            <CardTitle className="text-xl">
              {shipment.recipient_name}
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar envío
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground font-medium">Cliente</dt>
            <dd className="mt-1">{shipment.customer.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Almacén de origen</dt>
            <dd className="mt-1">
              <span className="font-mono text-xs">{shipment.origin_warehouse.code}</span>
              {' — '}
              {shipment.origin_warehouse.name}
              {', '}
              {shipment.origin_warehouse.city}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Ruta</dt>
            <dd className="mt-1">
              {shipment.route
                ? `${shipment.route.code} — ${shipment.route.name}`
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Vehículo</dt>
            <dd className="mt-1">
              {shipment.vehicle
                ? shipment.vehicle.plate
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Dirección de origen</dt>
            <dd className="mt-1">{shipment.origin_address}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Dirección de destino</dt>
            <dd className="mt-1">
              {shipment.destination_address},{' '}
              {shipment.destination_city},{' '}
              {shipment.destination_country}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Destinatario</dt>
            <dd className="mt-1">
              {shipment.recipient_name}
              {shipment.recipient_phone && (
                <span className="text-muted-foreground ml-2">({shipment.recipient_phone})</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Fecha programada</dt>
            <dd className="mt-1">{formatDate(shipment.scheduled_date)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Entrega estimada</dt>
            <dd className="mt-1">
              {shipment.estimated_delivery
                ? formatDate(shipment.estimated_delivery)
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Entrega real</dt>
            <dd className="mt-1">
              {shipment.actual_delivery
                ? formatDateTime(shipment.actual_delivery)
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground font-medium mb-2">Desglose de costos</dt>
            <dd>
              <div className="flex items-center gap-2 flex-wrap text-sm rounded-md border bg-muted/40 px-4 py-3">
                <span className="text-muted-foreground">Costo base</span>
                <span className="font-medium">{formatCurrency(shipment.base_cost)}</span>
                <span className="text-muted-foreground">+</span>
                <span className="text-muted-foreground">IGV/Impuestos (18%)</span>
                <span className="font-medium">{formatCurrency(shipment.tax_amount)}</span>
                <span className="text-muted-foreground">=</span>
                <span className="font-semibold text-foreground">{formatCurrency(shipment.total_cost)}</span>
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                El costo total es ingresado manualmente al editar el envío.
              </p>
            </dd>
          </div>
          {shipment.notes && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground font-medium">Notas</dt>
              <dd className="mt-1">{shipment.notes}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
