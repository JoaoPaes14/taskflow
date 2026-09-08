import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (!req.url.includes('/api/auth/')) {
          localStorage.removeItem('taskflow_token');
          router.navigate(['/login']);
          toast.error('Sessao expirada. Faca login novamente.');
        }
      } else if (error.status === 403) {
        toast.error('Voce nao tem permissao para esta acao.');
      } else if (error.status === 404) {
        toast.error('Recurso nao encontrado.');
      } else if (error.status >= 500) {
        toast.error('Erro interno do servidor. Tente novamente.');
      }

      return throwError(() => error);
    }),
  );
};
