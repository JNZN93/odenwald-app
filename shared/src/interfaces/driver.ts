export interface Driver {
  id: string;
  user_id: string;
  tenant_id: string;
  vehicle_type: 'bicycle' | 'motorcycle' | 'car' | 'scooter';
  vehicle_info?: {
    make?: string;
    model?: string;
    color?: string;
    license_plate?: string;
  };
  current_location?: {
    latitude: number;
    longitude: number;
    updated_at: Date;
  };
  status: 'available' | 'busy' | 'offline' | 'on_break';
  is_active: boolean;
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  created_at: Date;
  updated_at: Date;
}

export interface DriverDTO extends Omit<Driver, 'created_at' | 'updated_at' | 'current_location'> {
  created_at: string;
  updated_at: string;
  current_location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
}

export interface CreateDriverRequest {
  user_id: string;
  vehicle_type: Driver['vehicle_type'];
  vehicle_info?: Driver['vehicle_info'];
}

export interface UpdateDriverRequest {
  vehicle_type?: Driver['vehicle_type'];
  vehicle_info?: Driver['vehicle_info'];
  status?: Driver['status'];
  is_active?: boolean;
}

export interface UpdateDriverLocationRequest {
  latitude: number;
  longitude: number;
}

export interface UpdateDriverStatusRequest {
  status: Driver['status'];
}

export interface RateDriverRequest {
  rating: number;
}

export interface DriverFilters {
  tenant_id?: string;
  status?: Driver['status'];
  is_active?: boolean;
}

export interface DriverStats {
  total_drivers: number;
  available_drivers: number;
  busy_drivers: number;
  average_rating: number;
  total_deliveries: number;
  total_earnings: number;
}

