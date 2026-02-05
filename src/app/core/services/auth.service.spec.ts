import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AuthService } from './auth.service';
import { AuthResponse, User, LoginRequest } from '../../shared/models';
import { NotificationService } from '../../shared/services/notification.service';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let routerSpy: any;
    let notificationServiceSpy: any;

    beforeEach(() => {
        // Criar mocks para as dependências
        routerSpy = {
            navigate: vi.fn()
        };

        notificationServiceSpy = {
            error: vi.fn(),
            info: vi.fn(),
            success: vi.fn()
        };

        // Mock do sessionStorage
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
            const mockData: { [key: string]: string } = {
                'token': 'mock-token',
                'refreshToken': 'mock-refresh-token',
                'currentUser': JSON.stringify({ username: 'testuser' })
            };
            return mockData[key] || null;
        });

        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { });
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { });

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        vi.restoreAllMocks();
    });

    it('Verifica se o serviço é criado corretamente', () => {
        expect(service).toBeTruthy();
    });

    it('Inicializa não autenticado quando não há dados no storage', () => {
        // Reset mocks para simular storage vazio
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

        // Recriar serviço para testar inicialização
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        });

        const newService = TestBed.inject(AuthService);

        expect(newService.isAuthenticated()).toBe(false);
        expect(newService.currentUser()).toBe(null);
        expect(newService.token()).toBe(null);
    });

    it('Faz login com sucesso e armazena tokens', async () => {
        const mockCredentials: LoginRequest = { username: 'admin', password: 'admin' };
        const mockResponse: AuthResponse = {
            access_token: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expires_in: 3600,
            refresh_expires_in: 86400
        };

        const loginPromise = service.login(mockCredentials).toPromise();

        const req = httpMock.expectOne('https://pet-manager-api.geia.vip/autenticacao/login');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockCredentials);
        req.flush(mockResponse);

        const response = await loginPromise;
        expect(response).toEqual(mockResponse);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.token()).toBe('new-access-token');
        expect(service.currentUser()).toEqual({ username: 'user' });
    });

    it('Tentar logar com credenciais erradas', async () => {
        const mockCredentials: LoginRequest = { username: 'admin', password: 'wrong' };

        // Garantir que o serviço comece em estado não autenticado
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        });

        const newService = TestBed.inject(AuthService);
        const httpMockNew = TestBed.inject(HttpTestingController);

        const loginPromise = newService.login(mockCredentials).toPromise();

        const req = httpMockNew.expectOne('https://pet-manager-api.geia.vip/autenticacao/login');
        expect(req.request.method).toBe('POST');

        // Simular erro HTTP 401
        req.error(new ErrorEvent('network error'), { status: 401, statusText: 'Unauthorized' });

        try {
            await loginPromise;
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.status).toBe(401);
            expect(newService.isAuthenticated()).toBe(false);
        }
    });

    it('Renova o token com sucesso', async () => {
        const mockResponse: AuthResponse = {
            access_token: 'refreshed-access-token',
            refreshToken: 'refreshed-refresh-token',
            expires_in: 3600,
            refresh_expires_in: 86400
        };

        const refreshPromise = service.refreshToken().toPromise();

        const req = httpMock.expectOne('https://pet-manager-api.geia.vip/autenticacao/refresh');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' });
        req.flush(mockResponse);

        const response = await refreshPromise;
        expect(response).toEqual(mockResponse);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.token()).toBe('refreshed-access-token');
        expect(notificationServiceSpy.info).toHaveBeenCalledWith(
            'Sessão Renovada',
            'Sua sessão foi renovada automaticamente.'
        );
    });

    it('Falha na renovação do token quando nenhum token estiver disponível', async () => {
        // Simular sem refresh token
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        });

        const newService = TestBed.inject(AuthService);

        const refreshPromise = newService.refreshToken().toPromise();

        try {
            await refreshPromise;
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.message).toBe('No refresh token available');
            expect(notificationServiceSpy.error).toHaveBeenCalledWith(
                'Sessão Expirada',
                'Faça login novamente para continuar.'
            );
        }
    });

    it('Faz logout e limpa todos os dados', () => {
        // Primeiro fazer login para ter dados
        const mockResponse: AuthResponse = {
            access_token: 'test-token',
            refreshToken: 'test-refresh-token',
            expires_in: 3600,
            refresh_expires_in: 86400
        };

        service.login({ username: 'admin', password: 'admin' }).subscribe(() => {
            // Agora testar logout
            service.logout();

            expect(service.isAuthenticated()).toBe(false);
            expect(service.currentUser()).toBe(null);
            expect(service.token()).toBe(null);
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
        });

        const req = httpMock.expectOne('https://pet-manager-api.geia.vip/autenticacao/login');
        req.flush(mockResponse);
    });

    it('Carrega os dados de autenticação do sessionStorage', () => {
        // Reset para testar carregamento do storage
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        });

        const newService = TestBed.inject(AuthService);

        expect(newService.isAuthenticated()).toBe(true);
        expect(newService.token()).toBe('mock-token');
        expect(newService.currentUser()).toEqual({ username: 'testuser' });
    });
});