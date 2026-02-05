import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { authGuard, noAuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let authServiceSpy: any;
  let routerSpy: any;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: vi.fn()
    };

    routerSpy = {
      navigate: vi.fn()
    };

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {
      url: '/protected-route'
    } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  describe('authGuard', () => {
    it('Permiti o acesso quando o usuário está autenticado', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('Nega o acesso e redireciona para a página de login quando o usuário não estiver autenticado', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/protected-route' }
      });
    });

    it('Redireciona com o returnUrl correto para rotas diferentes', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(false);
      mockState.url = '/tutores/list';

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/tutores/list' }
      });
    });
  });

  describe('noAuthGuard', () => {
    it('Permite o acesso mesmo quando o usuário não estiver autenticado', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        noAuthGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('Nega o acesso e redireciona para pets quando o usuário está autenticado', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        noAuthGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/pets']);
    });

    it('Redirecionar para a página Pets independentemente da rota atual quando autenticado', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);
      mockState.url = '/auth/login';

      const result = TestBed.runInInjectionContext(() =>
        noAuthGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/pets']);
    });
  });
});