import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.';

      if (error.status === 0) {
        message = 'Kan de server niet bereiken. Controleer uw internetverbinding.';
      } else if (error.status === 400) {
        const body = error.error as { message?: string | string[] };
        if (Array.isArray(body?.message)) {
          message = body.message.join(', ');
        } else if (typeof body?.message === 'string') {
          message = body.message;
        } else {
          message = 'Ongeldige aanvraag. Controleer uw gegevens.';
        }
      } else if (error.status === 404) {
        message = 'De gevraagde resource is niet gevonden.';
      } else if (error.status === 409) {
        message = 'Conflict: de aanvraag kon niet worden verwerkt.';
      } else if (error.status === 429) {
        message = 'Te veel verzoeken. Wacht even en probeer het opnieuw.';
      } else if (error.status >= 500) {
        message = 'Serverfout. Probeer het later opnieuw.';
      }

      // Show toast — but not for background polling requests to avoid spam
      if (!req.url.includes('/status')) {
        toast.error(message);
      }

      return throwError(() => error);
    }),
  );
};
