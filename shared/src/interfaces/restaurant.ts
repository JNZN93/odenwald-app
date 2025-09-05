export interface Restaurant {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  cuisine_type: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact_info: {
    phone: string;
    email?: string;
    website?: string;
  };
  opening_hours: {
    [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
      open: string;
      close: string;
      is_closed: boolean;
    };
  };
  delivery_info: {
    delivery_radius_km: number;
    minimum_order_amount: number;
    delivery_fee: number;
    estimated_delivery_time_minutes: number;
    free_delivery_threshold?: number;
  };
  images: {
    logo?: string;
    banner?: string;
    gallery: string[];
  };
  payment_methods: {
    cash: boolean;
    card: boolean;
    paypal: boolean;
  };
  rating: number;
  total_reviews: number;
  is_active: boolean;
  is_immediately_closed: boolean;
  is_verified: boolean;
  owner_name?: string;
  owner_email?: string;
  registration_status?: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface RestaurantDTO extends Omit<Restaurant, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
}

export interface CreateRestaurantRequest {
  name: string;
  slug: string;
  description?: string;
  cuisine_type: string;
  address: Restaurant['address'];
  contact_info: Restaurant['contact_info'];
  opening_hours: Restaurant['opening_hours'];
  delivery_info: Restaurant['delivery_info'];
  images?: Partial<Restaurant['images']>;
}

export interface UpdateRestaurantRequest {
  name?: string;
  slug?: string;
  description?: string;
  cuisine_type?: string;
  address?: Partial<Restaurant['address']>;
  contact_info?: Partial<Restaurant['contact_info']>;
  opening_hours?: Restaurant['opening_hours'];
  delivery_info?: Partial<Restaurant['delivery_info']>;
  images?: Partial<Restaurant['images']>;
  payment_methods?: Partial<Restaurant['payment_methods']>;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface RestaurantSearchFilters {
  tenant_id?: string;
  cuisine_type?: string;
  is_active?: boolean;
  delivery_radius?: number;
  min_rating?: number;
  price_range?: 'low' | 'medium' | 'high';
  is_open_now?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface RestaurantWithMenu extends Restaurant {
  categories: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens: string[];
  preparation_time_minutes: number;
}

export interface RestaurantStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
  top_menu_items: Array<{
    id: string;
    name: string;
    total_orders: number;
    revenue: number;
  }>;
  customer_ratings: {
    average: number;
    total: number;
    distribution: Record<number, number>;
  };
}
