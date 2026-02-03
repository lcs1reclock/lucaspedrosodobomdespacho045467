import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, LoginRequest } from '../../shared/models';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // Signals
  private currentUserSignal = signal<User | null>(this.getUserFromStorage());
  private tokenSignal = signal<string | null>(this.getTokenFromStorage());
  private refreshTokenSignal = signal<string | null>(this.getRefreshTokenFromStorage());
  private isAuthenticatedSignal = signal<boolean>(!!this.tokenSignal());

  // Computed signals
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());
  token = computed(() => this.tokenSignal());

  private readonly API_URL = environment.apiUrl;

  constructor() {
    this.syncAuthenticationState();
  }

  /**
   * Realiza login com usuário e senha
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('AuthService: Iniciando login...');
    return this.http.post<AuthResponse>(
      `${this.API_URL}/autenticacao/login`,
      credentials
    ).pipe(
      tap(response => {
        console.log('AuthService: Resposta de login recebida:', response);
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('AuthService: Erro no login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Atualiza o token usando o refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.refreshTokenSignal();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.put<AuthResponse>(
      `${this.API_URL}/autenticacao/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Realiza logout limpando os dados armazenados
   */
  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.isAuthenticatedSignal.set(false);

    // Remove do localStorage (apenas no navegador)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Retorna o token atual
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Retorna o refresh token atual
   */
  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  /**
   * Processa a resposta de autenticação e armazena os dados
   */
  private handleAuthResponse(response: AuthResponse): void {
    const accessToken = response.access_token;
    const refreshToken = response.refreshToken;
    const user: User = {
      username: 'user'
    };

    console.log('AuthService: Armazenando token:', accessToken?.substring(0, 20) + '...');
    
    this.tokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);

    console.log('AuthService: isAuthenticated:', this.isAuthenticatedSignal());
    console.log('AuthService: Token armazenado:', this.tokenSignal()?.substring(0, 20) + '...');

    // Armazena no localStorage para persistência (apenas no navegador)
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  /**
   * Recupera o token do localStorage
   */
  private getTokenFromStorage(): string | null {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Recupera o refresh token do localStorage
   */
  private getRefreshTokenFromStorage(): string | null {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('refreshToken');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Recupera o usuário do localStorage
   */
  private getUserFromStorage(): User | null {
    try {
      if (typeof window !== 'undefined') {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Sincroniza o estado de autenticação entre abas/janelas
   */
  private syncAuthenticationState(): void {
    // Apenas no navegador (não no servidor SSR)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        const token = this.getTokenFromStorage();
        const refreshToken = this.getRefreshTokenFromStorage();
        const user = this.getUserFromStorage();

        this.tokenSignal.set(token);
        this.refreshTokenSignal.set(refreshToken);
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(!!token);
      });
    }
  }
}
