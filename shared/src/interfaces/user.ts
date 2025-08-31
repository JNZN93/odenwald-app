export interface User {
  id: string;
  name: string;
  email: string;
  role: 'app_admin' | 'admin' | 'manager' | 'driver' | 'customer';
  tenant_id: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserDTO extends Omit<User, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  tenant_id: string;
  phone?: string;
  address?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
  token: string;
}

export interface RegisterRequest extends CreateUserRequest {}

export interface RegisterResponse extends LoginResponse {}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface UserFilters {
  tenant_id?: string;
  role?: User['role'];
  is_active?: boolean;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  users_by_role: Record<string, number>;
}

