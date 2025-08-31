import { Injectable, ErrorHandler, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';
import { LoadingService } from './loading.service';

export interface AppError {
  message: string;
  code?: string | number;
  status?: number;
  details?: any;
  timestamp: number;
  context?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {

  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  constructor() {
    // Registriere als globaler Error Handler
    // Dies wird automatisch von Angular verwendet
  }

  /**
   * Globaler Error Handler für unbehandelte Fehler
   */
  handleError(error: any): void {
    console.error('Global Error Handler:', error);

    // Stoppe alle Loading States bei einem Fehler
    this.loadingService.stopAll();

    // Extrahiere Fehlerinformationen
    const appError = this.extractErrorInfo(error);

    // Zeige Toast-Nachricht basierend auf Fehlerart
    this.showErrorToast(appError);

    // Logge Fehler für Monitoring/Analytics
    this.logError(appError);
  }

  /**
   * Behandelt HTTP-Fehler spezifisch
   */
  handleHttpError(error: HttpErrorResponse, context?: string): AppError {
    console.error('HTTP Error:', error);

    this.loadingService.stopAll();

    const appError = this.extractHttpErrorInfo(error, context);
    this.showErrorToast(appError);
    this.logError(appError);

    return appError;
  }

  /**
   * Behandelt API-Fehler mit benutzerdefinierten Nachrichten
   */
  handleApiError(error: any, customMessage?: string, context?: string): AppError {
    console.error('API Error:', error);

    this.loadingService.stopAll();

    const appError = this.extractApiErrorInfo(error, customMessage, context);
    this.showErrorToast(appError);
    this.logError(appError);

    return appError;
  }

  /**
   * Zeigt eine benutzerdefinierte Fehlermeldung
   */
  showCustomError(title: string, message: string, context?: string): void {
    const appError: AppError = {
      message,
      timestamp: Date.now(),
      context
    };

    this.toastService.error(title, message);
    this.logError(appError);
  }

  /**
   * Zeigt eine Erfolgsmeldung
   */
  showSuccess(title: string, message: string): void {
    this.toastService.success(title, message);
  }

  /**
   * Zeigt eine Warnmeldung
   */
  showWarning(title: string, message: string): void {
    this.toastService.warning(title, message);
  }

  /**
   * Zeigt eine Informationsmeldung
   */
  showInfo(title: string, message: string): void {
    this.toastService.info(title, message);
  }

  private extractErrorInfo(error: any): AppError {
    if (error instanceof HttpErrorResponse) {
      return this.extractHttpErrorInfo(error);
    }

    return {
      message: error?.message || 'Ein unerwarteter Fehler ist aufgetreten',
      code: error?.code || 'UNKNOWN_ERROR',
      details: error,
      timestamp: Date.now(),
      context: 'global'
    };
  }

  private extractHttpErrorInfo(error: HttpErrorResponse, context?: string): AppError {
    let message = 'Ein Netzwerkfehler ist aufgetreten';
    let code = 'HTTP_ERROR';

    if (error.error && typeof error.error === 'object' && error.error.message) {
      message = error.error.message;
      code = error.error.code || error.status.toString();
    } else if (error.status === 0) {
      message = 'Keine Internetverbindung oder Server nicht erreichbar';
      code = 'CONNECTION_ERROR';
    } else if (error.status >= 400 && error.status < 500) {
      switch (error.status) {
        case 400:
          message = 'Ungültige Anfrage';
          break;
        case 401:
          message = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
          break;
        case 403:
          message = 'Zugriff verweigert';
          break;
        case 404:
          message = 'Die angeforderte Ressource wurde nicht gefunden';
          break;
        case 422:
          message = 'Validierungsfehler';
          break;
        default:
          message = `Client-Fehler: ${error.status}`;
      }
      code = error.status.toString();
    } else if (error.status >= 500) {
      message = 'Server-Fehler. Bitte versuchen Sie es später erneut.';
      code = 'SERVER_ERROR';
    }

    return {
      message,
      code,
      status: error.status,
      details: error.error,
      timestamp: Date.now(),
      context: context || 'http'
    };
  }

  private extractApiErrorInfo(error: any, customMessage?: string, context?: string): AppError {
    let message = customMessage || 'Ein API-Fehler ist aufgetreten';
    let code = 'API_ERROR';

    if (error?.message) {
      message = error.message;
    }

    if (error?.code) {
      code = error.code;
    }

    return {
      message,
      code,
      details: error,
      timestamp: Date.now(),
      context: context || 'api'
    };
  }

  private showErrorToast(error: AppError): void {
    let title = 'Fehler';
    let message = error.message;

    // Spezielle Behandlung für verschiedene Fehlerarten
    if (error.status === 401) {
      title = 'Authentifizierung erforderlich';
      message = 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.';
    } else if (error.status === 403) {
      title = 'Zugriff verweigert';
      message = 'Sie haben nicht die erforderlichen Berechtigungen.';
    } else if (error.status === 404) {
      title = 'Nicht gefunden';
      message = 'Die angeforderte Ressource existiert nicht.';
    } else if (error.status >= 500) {
      title = 'Server-Fehler';
      message = 'Ein Server-Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
    }

    this.toastService.error(title, message);
  }

  private logError(error: AppError): void {
    // Hier könnte ein Logging-Service integriert werden
    // z.B. Sentry, LogRocket, oder ein eigenes Logging-System

    const logData = {
      timestamp: new Date(error.timestamp).toISOString(),
      level: 'error',
      message: error.message,
      code: error.code,
      status: error.status,
      context: error.context,
      details: error.details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Application Error:', logData);

    // TODO: Senden an Monitoring-Service
    // this.monitoringService.logError(logData);
  }
}
