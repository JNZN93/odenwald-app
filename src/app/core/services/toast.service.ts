import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  private toastCounter = 0;

  public toasts$: Observable<ToastMessage[]> = this.toastsSubject.asObservable();

  /**
   * Zeigt eine Erfolgsnachricht
   */
  success(title: string, message: string, duration = 5000, action?: { label: string; callback: () => void }) {
    this.show('success', title, message, duration, action);
  }

  /**
   * Zeigt eine Fehlernachricht
   */
  error(title: string, message: string, duration = 7000, action?: { label: string; callback: () => void }) {
    this.show('error', title, message, duration, action);
  }

  /**
   * Zeigt eine Warnung
   */
  warning(title: string, message: string, duration = 6000, action?: { label: string; callback: () => void }) {
    this.show('warning', title, message, duration, action);
  }

  /**
   * Zeigt eine Informationsnachricht
   */
  info(title: string, message: string, duration = 5000, action?: { label: string; callback: () => void }) {
    this.show('info', title, message, duration, action);
  }

  /**
   * Zeigt eine benutzerdefinierte Toast-Nachricht
   */
  show(type: ToastMessage['type'], title: string, message: string, duration = 5000, action?: { label: string; callback: () => void }) {
    const toast: ToastMessage = {
      id: `toast-${++this.toastCounter}`,
      type,
      title,
      message,
      duration,
      action,
      timestamp: Date.now()
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Automatisch entfernen nach duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }

  /**
   * Entfernt eine Toast-Nachricht
   */
  remove(toastId: string) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== toastId));
  }

  /**
   * Entfernt alle Toast-Nachrichten
   */
  clear() {
    this.toastsSubject.next([]);
  }

  /**
   * Entfernt alle Toast-Nachrichten eines bestimmten Typs
   */
  clearByType(type: ToastMessage['type']) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.type !== type));
  }

  /**
   * Gibt die Anzahl der aktuellen Toast-Nachrichten zurück
   */
  getCount(): number {
    return this.toastsSubject.value.length;
  }

  /**
   * Gibt die Anzahl der Toast-Nachrichten eines bestimmten Typs zurück
   */
  getCountByType(type: ToastMessage['type']): number {
    return this.toastsSubject.value.filter(toast => toast.type === type).length;
  }
}
