export interface User {
  id?: number;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  profile_photo?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  profile_photo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaceData {
  id?: number;
  user_id: number;
  face_descriptor: string; // JSON stringified array of face descriptors
  photo_path: string;
  is_primary: boolean;
  created_at?: string;
}

export interface LoginSession {
  id?: number;
  user_id: number;
  login_method: 'password' | 'face';
  ip_address?: string;
  user_agent?: string;
  login_time?: string;
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password?: string;
}

export interface FaceLoginRequest {
  faceDescriptor: number[];
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserResponse;
  message?: string;
}