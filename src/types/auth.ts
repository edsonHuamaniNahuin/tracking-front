import type { User } from './user';
import type { ApiResponse } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginData {
  user: User;
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export type LoginResponse = ApiResponse<LoginData | null>

export interface AuthContextResponse {
  user: User | null
  loading: boolean
  error: string | null
  initializing: boolean;
  login: (request: LoginRequest) => Promise<void>
  logout: () => void
}