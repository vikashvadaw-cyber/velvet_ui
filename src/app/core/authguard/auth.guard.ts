import { inject, Inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.services';
import { state } from '@angular/animations';

export const authGuard: CanActivateFn = (routes, state) => {
  const authservice = inject(AuthService);
  const router = inject(Router);

  if (authservice.isauthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
