import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err) => {
      if ([401, 403].includes(err.status)) {
        // Auto logout if 401 response returned from api
        authService.clearSession();
        // optionally navigate to login
      }
      const error = err.error?.message || err.statusText;
      console.error(err);
      return throwError(() => new Error(error));
    })
  );
};
