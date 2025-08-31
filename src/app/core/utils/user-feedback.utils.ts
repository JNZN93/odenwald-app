import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { ConfirmationService } from '../services/confirmation.service';
import { LoadingService } from '../services/loading.service';
import { ErrorHandlerService } from '../services/error-handler.service';

/**
 * Utility-Klasse für häufig verwendete User Feedback Patterns
 * Diese Klasse bietet vorgefertigte Methoden für gängige UI-Interaktionen
 */
export class UserFeedbackUtils {

  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private loadingService = inject(LoadingService);
  private errorHandlerService = inject(ErrorHandlerService);

  // Toast-Nachrichten
  showSuccess(title: string, message: string) {
    this.toastService.success(title, message);
  }

  showError(title: string, message: string) {
    this.toastService.error(title, message);
  }

  showWarning(title: string, message: string) {
    this.toastService.warning(title, message);
  }

  showInfo(title: string, message: string) {
    this.toastService.info(title, message);
  }

  // Bestätigungsdialoge
  async confirmDelete(title = 'Löschen bestätigen', message = 'Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?') {
    return this.confirmationService.confirmDelete(title, message);
  }

  async confirmSave(title = 'Änderungen speichern', message = 'Möchten Sie Ihre Änderungen speichern?') {
    return this.confirmationService.confirm({
      title,
      message,
      confirmText: 'Speichern',
      type: 'default'
    });
  }

  async confirmCancel(title = 'Abbrechen bestätigen', message = 'Möchten Sie wirklich abbrechen? Nicht gespeicherte Änderungen gehen verloren.') {
    return this.confirmationService.confirm({
      title,
      message,
      confirmText: 'Abbrechen',
      cancelText: 'Fortfahren',
      type: 'warning'
    });
  }

  // Loading States
  startLoading(key: string = 'global') {
    this.loadingService.start(key);
  }

  stopLoading(key: string = 'global') {
    this.loadingService.stop(key);
  }

  withLoading<T>(key: string = 'global') {
    return this.loadingService.withLoading<T>(key);
  }

  // CRUD Operationen mit Feedback
  async createItem<T>(
    createFn: () => Promise<T>,
    successMessage = 'Element erfolgreich erstellt',
    errorMessage = 'Fehler beim Erstellen'
  ): Promise<T | null> {
    try {
      this.startLoading();
      const result = await createFn();
      this.showSuccess('Erfolgreich', successMessage);
      return result;
    } catch (error) {
      this.errorHandlerService.handleApiError(error, errorMessage);
      return null;
    } finally {
      this.stopLoading();
    }
  }

  async updateItem<T>(
    updateFn: () => Promise<T>,
    successMessage = 'Element erfolgreich aktualisiert',
    errorMessage = 'Fehler beim Aktualisieren'
  ): Promise<T | null> {
    try {
      this.startLoading();
      const result = await updateFn();
      this.showSuccess('Aktualisiert', successMessage);
      return result;
    } catch (error) {
      this.errorHandlerService.handleApiError(error, errorMessage);
      return null;
    } finally {
      this.stopLoading();
    }
  }

  async deleteItem(
    deleteFn: () => Promise<void>,
    successMessage = 'Element erfolgreich gelöscht',
    errorMessage = 'Fehler beim Löschen'
  ): Promise<boolean> {
    const confirmed = await this.confirmDelete();
    if (!confirmed) return false;

    try {
      this.startLoading();
      await deleteFn();
      this.showSuccess('Gelöscht', successMessage);
      return true;
    } catch (error) {
      this.errorHandlerService.handleApiError(error, errorMessage);
      return false;
    } finally {
      this.stopLoading();
    }
  }

  // Form Validierung mit Feedback
  validateAndSave<T>(
    isValid: boolean,
    saveFn: () => Promise<T>,
    validationMessage = 'Bitte füllen Sie alle erforderlichen Felder aus'
  ): Promise<T | null> {
    if (!isValid) {
      this.showWarning('Validierung', validationMessage);
      return Promise.resolve(null);
    }

    return this.updateItem(saveFn);
  }

  // Navigation mit Bestätigung
  async confirmNavigation(
    hasUnsavedChanges: boolean,
    navigateFn: () => void,
    title = 'Ungespeicherte Änderungen',
    message = 'Sie haben ungespeicherte Änderungen. Möchten Sie diese zuerst speichern?'
  ): Promise<void> {
    if (hasUnsavedChanges) {
      const confirmed = await this.confirmationService.confirm({
        title,
        message,
        confirmText: 'Speichern',
        cancelText: 'Verwerfen',
        type: 'warning'
      });

      if (confirmed) {
        // Hier könnte eine Save-Funktion aufgerufen werden
        console.log('Änderungen sollten gespeichert werden');
      }
    }

    navigateFn();
  }

  // Network Status Feedback
  showOfflineMessage() {
    this.showWarning('Offline', 'Sie sind offline. Einige Funktionen sind nicht verfügbar.');
  }

  showOnlineMessage() {
    this.showSuccess('Online', 'Verbindung wiederhergestellt.');
  }

  showRetryMessage() {
    this.showInfo('Wiederholung', 'Versuche es noch einmal...');
  }

  // Bulk Operations Feedback
  showBulkSuccess(count: number, operation: string) {
    this.showSuccess('Erfolgreich', `${count} ${operation} erfolgreich ausgeführt`);
  }

  showBulkError(count: number, operation: string) {
    this.showError('Fehler', `${count} ${operation} konnten nicht ausgeführt werden`);
  }

  showBulkPartialSuccess(successCount: number, errorCount: number, operation: string) {
    this.showWarning('Teilweise erfolgreich', `${successCount} ${operation} erfolgreich, ${errorCount} fehlgeschlagen`);
  }
}

// Factory-Funktion für Dependency Injection
export function createUserFeedbackUtils() {
  return new UserFeedbackUtils();
}
