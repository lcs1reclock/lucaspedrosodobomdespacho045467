import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { throwError, BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Interceptor funcional que:
 * 1. Anexa o Bearer Token em requisições
 * 2. Trata erro 401 tentando refresh automático
 * 3. Repetente a requisição original após obter novo token
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // Adiciona o token na requisição se existir
  const token = authService.getToken();
  if (token) {
    // console.log('Interceptor: Token encontrado, anexando ao header...');
    req = addToken(req, token);
  } else {
    // console.warn('Interceptor: Nenhum token encontrado! (Empty token!)');
  }

  return next(req).pipe(
    catchError(error => {
      // Se o erro for 401 e não estiver já tentando fazer refresh
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // console.log('Interceptor: Erro 401 detectado, tentando refresh...');
        return handle401Error(req, next, authService);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Adiciona o token Bearer no header da requisição
 */
function addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Trata o erro 401 tentando fazer refresh do token
 */
function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    // Verificar se há refresh token disponível antes de tentar
    if (!authService.getRefreshToken()) {
      // console.warn('Interceptor: Sem refresh token disponível, fazendo logout...');
      isRefreshing = false;
      authService.logout();
      // Redirecionar para login será feito pelo guard
      return throwError(() => new Error('Sessão expirada'));
    }

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newToken = response.access_token;
        refreshTokenSubject.next(newToken);

        // Retry da requisição original com o novo token
        return next(addToken(req, newToken));
      }),
      catchError(error => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      })
    );
  } else {
    // Aguarda o refresh ser concluído e tenta novamente
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(addToken(req, token as string));
      })
    );
  }
}
