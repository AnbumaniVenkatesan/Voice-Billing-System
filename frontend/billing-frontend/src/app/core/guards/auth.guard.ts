import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map, catchError, of } from 'rxjs';

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload?.exp;
    if (!exp) return false;
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    if (isTokenExpired(authService.getToken())) {
      authService.logout();
      router.navigate(['/login']);
      return false;
    }
    return true;
  }

  const isSetupRoute = state.url.includes('company-settings');

  return authService.getStatus().pipe(
    map(status => {
      if (!status.hasUsers && isSetupRoute) {
        return true;
      }
      if (!status.hasUsers) {
        router.navigate(['/company-settings']);
        return false;
      }
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isSuperAdmin()) {
    if (isTokenExpired(authService.getToken())) {
      authService.logout();
      router.navigate(['/login']);
      return false;
    }
    return true;
  }

  if (authService.isLoggedIn()) {
    router.navigate(['/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};
