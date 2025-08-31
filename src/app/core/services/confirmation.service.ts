import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationDialog {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger' | 'warning' | 'info';
  showCancel?: boolean;
}

export interface ConfirmationResult {
  confirmed: boolean;
  dialogId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private dialogSubject = new BehaviorSubject<ConfirmationDialog | null>(null);
  private resultSubject = new BehaviorSubject<ConfirmationResult | null>(null);

  public dialog$: Observable<ConfirmationDialog | null> = this.dialogSubject.asObservable();
  public result$: Observable<ConfirmationResult | null> = this.resultSubject.asObservable();

  /**
   * Zeigt einen Bestätigungsdialog
   */
  confirm(dialog: Omit<ConfirmationDialog, 'id'>): Promise<boolean> {
    const dialogWithId: ConfirmationDialog = {
      id: `confirm-${Date.now()}`,
      title: dialog.title,
      message: dialog.message,
      confirmText: dialog.confirmText || 'Bestätigen',
      cancelText: dialog.cancelText || 'Abbrechen',
      type: dialog.type || 'default',
      showCancel: dialog.showCancel !== false
    };

    this.dialogSubject.next(dialogWithId);

    return new Promise((resolve) => {
      const subscription = this.result$.subscribe(result => {
        if (result && result.dialogId === dialogWithId.id) {
          subscription.unsubscribe();
          this.dialogSubject.next(null);
          this.resultSubject.next(null);
          resolve(result.confirmed);
        }
      });
    });
  }

  /**
   * Vereinfachte Bestätigung mit Standard-Parametern
   */
  confirmDelete(title: string = 'Löschen bestätigen', message: string = 'Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?'): Promise<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'Löschen',
      cancelText: 'Abbrechen',
      type: 'danger'
    });
  }

  /**
   * Bestätigung für kritische Aktionen
   */
  confirmCritical(title: string, message: string): Promise<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'Fortfahren',
      cancelText: 'Abbrechen',
      type: 'danger'
    });
  }

  /**
   * Bestätigung für Warnungen
   */
  confirmWarning(title: string, message: string): Promise<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'Fortfahren',
      cancelText: 'Abbrechen',
      type: 'warning'
    });
  }

  /**
   * Schließt den aktuellen Dialog
   */
  close(confirmed: boolean): void {
    const currentDialog = this.dialogSubject.value;
    if (currentDialog) {
      this.resultSubject.next({
        confirmed,
        dialogId: currentDialog.id
      });
    }
  }

  /**
   * Bricht den Dialog ab (entspricht "Nein" oder "Abbrechen")
   */
  cancel(): void {
    this.close(false);
  }

  /**
   * Bestätigt den Dialog (entspricht "Ja" oder "Bestätigen")
   */
  accept(): void {
    this.close(true);
  }
}
