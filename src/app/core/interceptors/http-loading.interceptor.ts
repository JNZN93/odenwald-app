import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable()
export class HttpLoadingInterceptor implements HttpInterceptor {
  private loadingService = inject(LoadingService);
  private errorHandlerService = inject(ErrorHandlerService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Bestimme einen eindeutigen Schlüssel für diese Anfrage
    const requestKey = this.getRequestKey(request);

    // Starte Loading State
    this.loadingService.start(requestKey);

    return next.handle(request).pipe(
      tap(event => {
        // Bei erfolgreicher Antwort
        if (event instanceof HttpResponse) {
          // Optional: Success-Toast für bestimmte Endpunkte
          this.handleSuccessfulResponse(request, event);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Behandle HTTP-Fehler
        this.errorHandlerService.handleHttpError(error, request.url);

        // Re-throw den Fehler
        return throwError(() => error);
      }),
      finalize(() => {
        // Stoppe Loading State
        this.loadingService.stop(requestKey);
      })
    );
  }

  private getRequestKey(request: HttpRequest<any>): string {
    // Erstelle einen eindeutigen Schlüssel basierend auf URL und Methode
    const url = request.url.split('?')[0]; // Entferne Query-Parameter
    return `${request.method}-${url}`;
  }

  private handleSuccessfulResponse(request: HttpRequest<any>, response: HttpResponse<any>): void {
    // Optional: Zeige Success-Toast für wichtige Operationen
    const successEndpoints = [
      '/orders', // Neue Bestellungen
      '/restaurants', // Restaurant-Operationen
      '/menu-items', // Menü-Änderungen
    ];

    const isSuccessEndpoint = successEndpoints.some(endpoint =>
      request.url.includes(endpoint) && request.method !== 'GET'
    );

    if (isSuccessEndpoint && response.status === 201) {
      // Neue Ressource erstellt
      this.showSuccessMessage(request);
    } else if (isSuccessEndpoint && response.status === 200 && request.method === 'PUT') {
      // Ressource aktualisiert
      this.showUpdateMessage(request);
    }
  }

  private showSuccessMessage(request: HttpRequest<any>): void {
    let message = 'Operation erfolgreich abgeschlossen';

    if (request.url.includes('/orders')) {
      message = 'Bestellung erfolgreich aufgegeben';
    } else if (request.url.includes('/restaurants')) {
      message = 'Restaurant erfolgreich gespeichert';
    } else if (request.url.includes('/menu-items')) {
      message = 'Menü-Artikel erfolgreich hinzugefügt';
    }

    this.errorHandlerService.showSuccess('Erfolgreich', message);
  }

  private showUpdateMessage(request: HttpRequest<any>): void {
    let message = 'Änderungen erfolgreich gespeichert';

    if (request.url.includes('/orders')) {
      message = 'Bestellung erfolgreich aktualisiert';
    } else if (request.url.includes('/restaurants')) {
      message = 'Restaurant erfolgreich aktualisiert';
    } else if (request.url.includes('/menu-items')) {
      message = 'Menü-Artikel erfolgreich aktualisiert';
    }

    this.errorHandlerService.showSuccess('Aktualisiert', message);
  }
}
