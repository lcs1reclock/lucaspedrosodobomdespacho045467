export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: number;
  usuario: string;
  nome?: string;
}

export interface LoginRequest {
  usuario: string;
  senha: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
