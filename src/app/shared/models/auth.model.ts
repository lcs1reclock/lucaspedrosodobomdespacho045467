export interface AuthResponse {
  access_token: string;
  refreshToken: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface User {
  id?: number;
  username?: string;
  nome?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
