'use client';

import { useState, useMemo } from 'react';
import {
  PackageOpen,
  TrendingUp,
  UserCheck,
  Truck,
  Package,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  LabelList,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useShipmentStats,
  useVehicleStats,
  useDriverStats,
  useProductStats,
} from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';
import type {
  ShipmentStatus,
  ShipmentPriority,
  VehicleStatus,
  DriverStatus,
  ProductCategory,
} from '@/docs/schemas';

// ─── Labels & Colors ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_WAREHOUSE: 'En almacén',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  PENDING: '#9ca3af',
  CONFIRMED: '#3b82f6',
  IN_WAREHOUSE: '#6366f1',
  IN_TRANSIT: '#f97316',
  OUT_FOR_DELIVERY: '#eab308',
  DELIVERED: '#22c55e',
  FAILED: '#ef4444',
  CANCELLED: '#ef4444',
  RETURNED: '#a855f7',
};

const PRIORITY_LABELS: Record<ShipmentPriority, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const PRIORITY_COLORS: Record<ShipmentPriority, string> = {
  LOW: '#9ca3af',
  NORMAL: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En uso',
  MAINTENANCE: 'Mantenimiento',
  RETIRED: 'Retirado',
};

const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  AVAILABLE: '#22c55e',
  IN_USE: '#3b82f6',
  MAINTENANCE: '#eab308',
  RETIRED: '#9ca3af',
};

const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: 'Disponible',
  ON_ROUTE: 'En ruta',
  OFF_DUTY: 'Fuera de servicio',
  SUSPENDED: 'Suspendido',
};

const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  AVAILABLE: '#22c55e',
  ON_ROUTE: '#3b82f6',
  OFF_DUTY: '#9ca3af',
  SUSPENDED: '#ef4444',
};

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  LAPTOP:     '#6366f1', // indigo-500 — mismo que IN_WAREHOUSE
  DESKTOP:    '#3b82f6', // blue-500   — mismo que CONFIRMED / IN_USE
  MOBILE:     '#22c55e', // green-500  — mismo que AVAILABLE / DELIVERED
  TABLET:     '#eab308', // yellow-500 — mismo que MAINTENANCE
  PERIPHERAL: '#f97316', // orange-500 — mismo que IN_TRANSIT
  NETWORKING: '#a855f7', // purple-500 — mismo que RETURNED
  STORAGE:    '#9ca3af', // gray-400   — mismo que PENDING / LOW
  OTHER:      '#64748b', // slate-500  — tono neutro oscuro
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  LAPTOP: 'Portátil',
  DESKTOP: 'Escritorio',
  MOBILE: 'Móvil',
  TABLET: 'Tableta',
  PERIPHERAL: 'Periférico',
  NETWORKING: 'Redes',
  STORAGE: 'Almacenamiento',
  OTHER: 'Otro',
};

const MONTH_LABELS: Record<number, string> = {
  0: 'Ene', 1: 'Feb', 2: 'Mar', 3: 'Abr',
  4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Ago',
  8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dic',
};

// ─── ChartConfigs ─────────────────────────────────────────────────────────────

const shipmentStatusConfig: ChartConfig = {
  PENDING: { label: 'Pendiente', color: '#9ca3af' },
  CONFIRMED: { label: 'Confirmado', color: '#3b82f6' },
  IN_WAREHOUSE: { label: 'En almacén', color: '#6366f1' },
  IN_TRANSIT: { label: 'En tránsito', color: '#f97316' },
  OUT_FOR_DELIVERY: { label: 'En reparto', color: '#eab308' },
  DELIVERED: { label: 'Entregado', color: '#22c55e' },
  FAILED: { label: 'Fallido', color: '#ef4444' },
  CANCELLED: { label: 'Cancelado', color: '#ef4444' },
  RETURNED: { label: 'Devuelto', color: '#a855f7' },
};

const revenueConfig: ChartConfig = {
  total: { label: 'Ingresos', color: '#3b82f6' },
};

const priorityConfig: ChartConfig = {
  LOW: { label: 'Baja', color: '#9ca3af' },
  NORMAL: { label: 'Normal', color: '#3b82f6' },
  HIGH: { label: 'Alta', color: '#f97316' },
  URGENT: { label: 'Urgente', color: '#ef4444' },
};

const vehicleFleetConfig: ChartConfig = {
  AVAILABLE: { label: 'Disponible', color: '#22c55e' },
  IN_USE: { label: 'En uso', color: '#3b82f6' },
  MAINTENANCE: { label: 'Mantenimiento', color: '#eab308' },
  RETIRED: { label: 'Retirado', color: '#9ca3af' },
};

const driverFleetConfig: ChartConfig = {
  AVAILABLE: { label: 'Disponible', color: '#22c55e' },
  ON_ROUTE: { label: 'En ruta', color: '#3b82f6' },
  OFF_DUTY: { label: 'Fuera de servicio', color: '#9ca3af' },
  SUSPENDED: { label: 'Suspendido', color: '#ef4444' },
};

const inventoryConfig: ChartConfig = {
  stock: { label: 'Stock', color: '#6366f1' },
};

// ─── Shared components ────────────────────────────────────────────────────────

const KPI_STYLES = [
  { icon: 'bg-blue-600 text-white', border: 'border-t-blue-500' },
  { icon: 'bg-blue-600 text-white', border: 'border-t-blue-500' },
  { icon: 'bg-blue-600 text-white', border: 'border-t-blue-500' },
  { icon: 'bg-blue-600 text-white', border: 'border-t-blue-500' },
  { icon: 'bg-blue-600 text-white', border: 'border-t-blue-500' },
];

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorIndex = 0,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  colorIndex?: number;
}) {
  const style = KPI_STYLES[colorIndex % KPI_STYLES.length];
  return (
    <Card className={cn('gap-0 py-0 overflow-hidden border-t-4 shadow-sm', style.border)}>
      <CardHeader className="flex flex-row items-start justify-between pt-5 pb-2 px-5">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
          {title}
        </CardTitle>
        <span
          className={cn(
            'flex items-center justify-center h-9 w-9 rounded-xl shrink-0 shadow-sm',
            style.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="pb-5 px-5">
        <p className="text-3xl font-bold text-foreground tabular-nums leading-none">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DataLegend({
  entries,
}: {
  entries: { name: string; value: number; fill: string }[];
}) {
  const total = entries.reduce((s, e) => s + e.value, 0);
  return (
    <div className="mt-3 space-y-1.5">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {entry.value}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
              {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : '—'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FleetBar({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart height="h-32" />;
  return (
    <div className="space-y-4">
      {/* Segmented bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-neutral-100">
        {data.map((d, i) => (
          <div
            key={i}
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.fill }}
            title={`${d.name}: ${d.value}`}
          />
        ))}
      </div>
      {/* Legend rows */}
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: d.fill }}
              />
              <span className="text-xs text-muted-foreground">{d.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tabular-nums text-foreground">{d.value}</span>
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ height = 'h-48' }: { height?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-neutral-50 border border-dashed border-neutral-200',
        height,
      )}
    >
      <p className="text-sm text-neutral-400">Sin datos en el período</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [granularity, setGranularity] = useState<'monthly' | 'weekly'>('monthly');

  const dateRange =
    dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined;

  const shipmentQuery = useShipmentStats(dateRange);
  const vehicleQuery = useVehicleStats();
  const driverQuery = useDriverStats();
  const productQuery = useProductStats();

  const shipments = shipmentQuery.data?.results ?? [];
  const vehicles = vehicleQuery.data?.results ?? [];
  const drivers = driverQuery.data?.results ?? [];
  const products = productQuery.data?.results ?? [];

  // ── KPI computations ──────────────────────────────────────────────────────

  const totalShipments = shipments.length;

  const totalRevenue = useMemo(
    () => shipments.reduce((sum, s) => sum + parseFloat(s.total_cost || '0'), 0),
    [shipments],
  );

  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE').length;
  const totalDrivers = drivers.length;

  const activeVehicles = vehicles.filter((v) => v.status !== 'RETIRED').length;
  const totalVehicles = vehicles.length;

  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0);

  // ── Chart 1: Envíos por Estado ────────────────────────────────────────────

  const statusChartData = useMemo(() => {
    const counts: Partial<Record<ShipmentStatus, number>> = {};
    for (const s of shipments) {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status as ShipmentStatus] ?? status,
      value: count,
      fill: STATUS_COLORS[status as ShipmentStatus] ?? '#9ca3af',
    }));
  }, [shipments]);

  // ── Chart 2: Ingresos en el Tiempo ───────────────────────────────────────

  const revenueChartData = useMemo(() => {
    if (granularity === 'weekly') {
      const byWeek: Record<string, number> = {};
      for (const s of shipments) {
        const date = new Date(s.scheduled_date);
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const weekNum = Math.ceil(
          ((date.getTime() - startOfYear.getTime()) / 86400000 +
            startOfYear.getDay() + 1) / 7,
        );
        const key = `S${weekNum} ${year}`;
        byWeek[key] = (byWeek[key] ?? 0) + parseFloat(s.total_cost || '0');
      }
      return Object.entries(byWeek)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, total]) => ({ label, total }));
    }

    const byMonth: Record<string, number> = {};
    for (const s of shipments) {
      const date = new Date(s.scheduled_date);
      const key = `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
      byMonth[key] = (byMonth[key] ?? 0) + parseFloat(s.total_cost || '0');
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => {
        const [ma, ya] = a.split(' ');
        const [mb, yb] = b.split(' ');
        const monthOrder = Object.values(MONTH_LABELS);
        return (
          parseInt(ya) - parseInt(yb) ||
          monthOrder.indexOf(ma) - monthOrder.indexOf(mb)
        );
      })
      .map(([label, total]) => ({ label, total }));
  }, [shipments, granularity]);

  // ── Chart 3: Envíos por Prioridad ────────────────────────────────────────

  const priorityChartData = useMemo(() => {
    const counts: Partial<Record<ShipmentPriority, number>> = {};
    for (const s of shipments) {
      counts[s.priority] = (counts[s.priority] ?? 0) + 1;
    }
    return (['LOW', 'NORMAL', 'HIGH', 'URGENT'] as ShipmentPriority[])
      .filter((p) => counts[p] !== undefined)
      .map((p) => ({
        name: PRIORITY_LABELS[p],
        count: counts[p] ?? 0,
        fill: PRIORITY_COLORS[p],
      }));
  }, [shipments]);

  // ── Chart 4: Estado de Flota ──────────────────────────────────────────────

  const vehicleFleetData = useMemo(() => {
    const counts: Partial<Record<VehicleStatus, number>> = {};
    for (const v of vehicles) {
      counts[v.status] = (counts[v.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({
      name: VEHICLE_STATUS_LABELS[status as VehicleStatus] ?? status,
      value: count,
      fill: VEHICLE_STATUS_COLORS[status as VehicleStatus] ?? '#9ca3af',
    }));
  }, [vehicles]);

  const driverFleetData = useMemo(() => {
    const counts: Partial<Record<DriverStatus, number>> = {};
    for (const d of drivers) {
      counts[d.status] = (counts[d.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({
      name: DRIVER_STATUS_LABELS[status as DriverStatus] ?? status,
      value: count,
      fill: DRIVER_STATUS_COLORS[status as DriverStatus] ?? '#9ca3af',
    }));
  }, [drivers]);

  // ── Chart 5: Inventario por Categoría ────────────────────────────────────

  const inventoryChartData = useMemo(() => {
    const byCategory: Partial<Record<ProductCategory, number>> = {};
    for (const p of products) {
      byCategory[p.category] =
        (byCategory[p.category] ?? 0) + (p.stock_quantity ?? 0);
    }
    return Object.entries(byCategory)
      .map(([cat, qty]) => ({
        name: CATEGORY_LABELS[cat as ProductCategory] ?? cat,
        stock: qty ?? 0,
        fill: CATEGORY_COLORS[cat as ProductCategory] ?? '#c4b5fd',
      }))
      .sort((a, b) => b.stock - a.stock);
  }, [products]);

  const isLoading =
    shipmentQuery.isLoading ||
    vehicleQuery.isLoading ||
    driverQuery.isLoading ||
    productQuery.isLoading;

  const now = new Date();
  const dateLabel = now.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5 capitalize">
            {dateLabel}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Resumen operacional del sistema logístico
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 bg-white border border-border rounded-xl px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date-from" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Desde
          </Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-40 h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date-to" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Hasta
          </Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-40 h-9"
          />
        </div>
        {isLoading && (
          <span className="text-xs text-muted-foreground animate-pulse sm:pb-1">
            Cargando datos…
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          title="Total Envíos"
          value={totalShipments.toString()}
          icon={PackageOpen}
          colorIndex={0}
        />
        <KpiCard
          title="Ingresos Totales"
          value={`S/ ${totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          colorIndex={1}
        />
        <KpiCard
          title="Conductores"
          value={`${availableDrivers} / ${totalDrivers}`}
          subtitle="disponibles"
          icon={UserCheck}
          colorIndex={2}
        />
        <KpiCard
          title="Vehículos"
          value={`${activeVehicles} / ${totalVehicles}`}
          subtitle="activos"
          icon={Truck}
          colorIndex={3}
        />
        <KpiCard
          title="Stock Total"
          value={totalStock.toLocaleString('es-CO')}
          subtitle="unidades"
          icon={Package}
          colorIndex={4}
        />
      </div>

      {/* Row 1: Status donut + Revenue area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 [&_.recharts-wrapper]:outline-none">

        {/* Chart 1 — Envíos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Envíos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <EmptyChart height="h-52" />
            ) : (
              <>
                <div className="relative">
                  <ChartContainer config={shipmentStatusConfig} className="h-48 w-full">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        strokeWidth={2}
                        stroke="white"
                      >
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </PieChart>
                  </ChartContainer>
                  {/* Center total */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold tabular-nums leading-none text-foreground">
                      {totalShipments}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">envíos</span>
                  </div>
                </div>
                <DataLegend entries={statusChartData} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Chart 2 — Ingresos en el Tiempo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Ingresos en el Tiempo
            </CardTitle>
            <CardAction>
              <Select
                value={granularity}
                onValueChange={(v) => setGranularity(v as 'monthly' | 'weekly')}
              >
                <SelectTrigger className="w-28 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent>
            {revenueChartData.length === 0 ? (
              <EmptyChart height="h-52" />
            ) : (
              <ChartContainer config={revenueConfig} className="h-52 w-full">
                <LineChart
                  data={revenueChartData}
                  margin={{ top: 8, right: 56, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `S/${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [
                          `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                          'Ingresos',
                        ]}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  >
                    <LabelList
                      dataKey="total"
                      position="top"
                      style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                      formatter={(v) =>
                        `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      }
                    />
                  </Line>
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Envíos por Prioridad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">
            Envíos por Prioridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priorityChartData.length === 0 ? (
            <EmptyChart height="h-44" />
          ) : (
            <ChartContainer config={priorityConfig} className="h-44 w-full">
              <BarChart
                data={priorityChartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="30%"
              >
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Estado de Flota — Vehicles + Drivers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Vehicles fleet bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Estado de Vehículos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FleetBar data={vehicleFleetData} />
          </CardContent>
        </Card>

        {/* Drivers fleet bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Estado de Conductores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FleetBar data={driverFleetData} />
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Inventario por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">
            Inventario por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryChartData.length === 0 ? (
            <EmptyChart height="h-52" />
          ) : (
            <ChartContainer config={inventoryConfig} className="h-52 w-full">
              <BarChart
                layout="vertical"
                data={inventoryChartData}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={115}
                />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="stock" radius={[0, 5, 5, 0]}>
                  {inventoryChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
