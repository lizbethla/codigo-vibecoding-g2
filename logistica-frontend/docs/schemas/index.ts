// TypeScript types derived from logistica-api-claudecode backend models
// Source of truth: ../logistica-api-claudecode/apps/*/models.py + serializers.py

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  access: string;
  refresh: string;
  is_superuser: boolean;
  is_staff: boolean;
  user_id: number;
  username: string;
  email: string;
}

export interface AppUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: Group[];
  date_joined?: string;
  last_login?: string | null;
}

export interface AppUserCreate {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  groups?: number[];
}

export type AppUserUpdate = Partial<Omit<AppUserCreate, 'password'> & { password?: string }>;

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type_label: string;
}

export interface Group {
  id: number;
  name: string;
  permissions?: Permission[];
}

export interface GroupCreate {
  name: string;
  permissions?: number[];
}

export type GroupUpdate = GroupCreate;

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: Group[];
  date_joined: string;
  last_login: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Customers ────────────────────────────────────────────────────────────────

export type CustomerType = 'COMPANY' | 'INDIVIDUAL';

export interface Customer {
  id: number;
  name: string;
  customer_type: CustomerType;
  tax_id: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  is_active: boolean;
  created_at: string; // ISO datetime, read-only
  updated_at: string; // ISO datetime, read-only
}

export interface CustomerSummary {
  id: number;
  name: string;
  customer_type: CustomerType;
}

export type CustomerCreate = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<CustomerCreate>;

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  tax_id: string | null;
  is_active: boolean;
  created_at: string; // read-only
  updated_at: string; // read-only
}

export type SupplierCreate = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type SupplierUpdate = Partial<SupplierCreate>;

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'LAPTOP'
  | 'DESKTOP'
  | 'MOBILE'
  | 'TABLET'
  | 'PERIPHERAL'
  | 'NETWORKING'
  | 'STORAGE'
  | 'OTHER';

export interface Product {
  id: number;
  supplier: { id: number; name: string } | null;
  sku: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  unit_price: string; // Decimal as string
  weight_kg: string; // Decimal as string
  dimensions_cm: string | null; // e.g. "30x20x10"
  stock_quantity: number;
  is_active: boolean;
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface ProductCreate {
  supplier?: number; // Supplier id
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  unit_price: string;
  weight_kg?: string;
  dimensions_cm?: string;
  stock_quantity?: number;
  is_active?: boolean;
}
export type ProductUpdate = Partial<ProductCreate>;

// ─── Warehouses ───────────────────────────────────────────────────────────────

export interface WarehouseManager {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Warehouse {
  id: number;
  manager: WarehouseManager | null;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  latitude: string | null; // Decimal as string
  longitude: string | null; // Decimal as string
  capacity_m3: string | null; // Decimal as string
  is_active: boolean;
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface WarehouseSummary {
  id: number;
  code: string;
  name: string;
  city: string;
}

export interface WarehouseCreate {
  manager?: number; // User id
  name: string;
  code: string;
  address: string;
  city: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  capacity_m3?: string;
  is_active?: boolean;
}
export type WarehouseUpdate = Partial<WarehouseCreate>;

// ─── Drivers ──────────────────────────────────────────────────────────────────

export type LicenseType = 'A' | 'B' | 'C' | 'CE' | 'BTP';
export type DriverStatus = 'AVAILABLE' | 'ON_ROUTE' | 'OFF_DUTY' | 'SUSPENDED';

export interface DriverUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Driver {
  id: number;
  user: DriverUser;
  license_number: string;
  license_type: LicenseType;
  license_expiry: string; // YYYY-MM-DD
  phone: string;
  status: DriverStatus;
  date_of_birth: string | null; // YYYY-MM-DD
  national_id: string;
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface DriverSummary {
  id: number;
  national_id: string;
  license_number: string;
  license_type: LicenseType;
  full_name: string; // computed by backend
}

export interface DriverCreate {
  user: number; // User id
  license_number: string;
  license_type: LicenseType;
  license_expiry: string;
  phone: string;
  status?: DriverStatus;
  date_of_birth?: string;
  national_id: string;
}
export type DriverUpdate = Partial<DriverCreate>;

// ─── Vehicles (Transport) ─────────────────────────────────────────────────────

export type VehicleType =
  | 'MOTORCYCLE'
  | 'VAN'
  | 'TRUCK'
  | 'HEAVY_TRUCK'
  | 'REFRIGERATED_TRUCK'
  | 'CONTAINER';

export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'GAS';
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

export interface Vehicle {
  id: number;
  driver: DriverSummary | null;
  plate: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  capacity_kg: string; // Decimal as string
  capacity_m3: string | null; // Decimal as string
  fuel_type: FuelType;
  status: VehicleStatus;
  last_maintenance: string | null; // YYYY-MM-DD
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface VehicleSummary {
  id: number;
  plate: string;
  vehicle_type: VehicleType;
}

export interface VehicleCreate {
  driver?: number; // Driver id
  plate: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  capacity_kg: string;
  capacity_m3?: string;
  fuel_type?: FuelType;
  status?: VehicleStatus;
  last_maintenance?: string;
}
export type VehicleUpdate = Partial<VehicleCreate>;

// ─── Routes ───────────────────────────────────────────────────────────────────

export interface RouteStop {
  id: number;
  stop_name: string;
  order: number; // unique per route
  estimated_arrival_hours: string | null; // Decimal as string
  notes: string | null;
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface Route {
  id: number;
  name: string;
  code: string;
  origin_city: string;
  destination_city: string;
  distance_km: string | null; // Decimal as string
  estimated_hours: string | null; // Decimal as string
  is_active: boolean;
  stops: RouteStop[]; // only in detail view
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface RouteSummary {
  id: number;
  code: string;
  name: string;
  origin_city: string;
  destination_city: string;
}

export interface RouteCreate {
  name: string;
  code: string;
  origin_city: string;
  destination_city: string;
  distance_km?: string;
  estimated_hours?: string;
  is_active?: boolean;
}
export type RouteUpdate = Partial<RouteCreate>;

export interface RouteStopCreate {
  stop_name: string;
  order: number;
  estimated_arrival_hours?: string;
  notes?: string;
}
export type RouteStopUpdate = Partial<RouteStopCreate>;

// ─── Shipments ────────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_WAREHOUSE'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export type ShipmentPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ShipmentProduct {
  id: number;
  product: { id: number; sku: string; name: string };
  quantity: number;
  unit_price: string; // Decimal as string
  line_total: string; // auto-calculated: quantity * unit_price
  notes: string | null;
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface Shipment {
  id: number;
  tracking_code: string; // auto-generated: LOG-YYYY-XXXX
  customer: CustomerSummary;
  origin_warehouse: WarehouseSummary;
  route: RouteSummary | null;
  vehicle: VehicleSummary | null;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  origin_address: string;
  destination_address: string;
  destination_city: string;
  destination_country: string;
  recipient_name: string;
  recipient_phone: string | null;
  scheduled_date: string; // YYYY-MM-DD
  estimated_delivery: string | null; // YYYY-MM-DD
  actual_delivery: string | null; // ISO datetime
  total_weight_kg: string; // Decimal as string
  total_volume_m3: string | null; // Decimal as string
  base_cost: string; // Decimal as string
  tax_amount: string; // Decimal as string
  total_cost: string; // Decimal as string
  notes: string | null;
  shipment_products: ShipmentProduct[]; // only in detail view
  created_at: string; // read-only
  updated_at: string; // read-only
}

export interface ShipmentCreate {
  customer: number; // Customer id
  origin_warehouse: number; // Warehouse id
  route?: number; // Route id
  vehicle?: number; // Vehicle id
  status?: ShipmentStatus;
  priority?: ShipmentPriority;
  origin_address: string;
  destination_address: string;
  destination_city: string;
  destination_country?: string;
  recipient_name: string;
  recipient_phone?: string;
  scheduled_date: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  total_weight_kg?: string;
  total_volume_m3?: string;
  base_cost?: string;
  tax_amount?: string;
  total_cost?: string;
  notes?: string;
}
export type ShipmentUpdate = Partial<ShipmentCreate>;

export interface ShipmentProductCreate {
  product: number; // Product id
  quantity: number;
  unit_price: string;
  notes?: string;
}
export type ShipmentProductUpdate = Partial<ShipmentProductCreate>;
