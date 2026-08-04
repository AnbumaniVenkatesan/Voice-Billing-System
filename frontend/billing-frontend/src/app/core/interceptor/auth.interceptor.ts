import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

const PUBLIC_AUTH_URLS = ['/api/auth/login', '/api/auth/status', '/api/auth/super-admin-username', '/api/auth/create-super-admin'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  const isPublicAuthRequest = PUBLIC_AUTH_URLS.some(url => req.url.includes(url));

  let authReq = req;
  if (token && !isPublicAuthRequest) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    tap({
      error: (err) => {
        if (err?.status === 401 && !isPublicAuthRequest) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          if (router.url !== '/login') {
            router.navigate(['/login']);
          }
        }
      }
    })
  );
};
