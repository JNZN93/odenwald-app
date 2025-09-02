import { Component, inject, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="password-change-container">
      <div class="password-change-header">
        <h3>Passwort ändern</h3>
        <p>Sichern Sie Ihr Konto mit einem starken Passwort</p>
      </div>

      <form (ngSubmit)="changePassword()" #passwordForm="ngForm" class="password-change-form" [class.form-submitted]="hasBeenSubmitted">
        <!-- Current Password -->
        <div class="form-group">
          <label for="currentPassword">Aktuelles Passwort *</label>
          <div class="password-input-container">
            <input
              id="currentPassword"
              type="password"
              [(ngModel)]="passwordData.currentPassword"
              name="currentPassword"
              required
              placeholder="Geben Sie Ihr aktuelles Passwort ein"
            >
            <button
              type="button"
              class="toggle-password"
              (click)="togglePasswordVisibility('current')"
              [attr.aria-label]="showPasswords.current ? 'Passwort verbergen' : 'Passwort anzeigen'"
            >
              <i [class]="showPasswords.current ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div class="form-group">
          <label for="newPassword">Neues Passwort *</label>
          <div class="password-input-container">
            <input
              id="newPassword"
              type="password"
              [(ngModel)]="passwordData.newPassword"
              name="newPassword"
              required
              minlength="8"
              placeholder="Mindestens 8 Zeichen"
              (input)="checkPasswordStrength()"
            >
            <button
              type="button"
              class="toggle-password"
              (click)="togglePasswordVisibility('new')"
              [attr.aria-label]="showPasswords.new ? 'Passwort verbergen' : 'Passwort anzeigen'"
            >
              <i [class]="showPasswords.new ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>

          <!-- Password Strength Indicator -->
          <div class="password-strength" *ngIf="passwordData.newPassword">
            <div class="strength-bar">
              <div
                class="strength-fill"
                [class.strength-weak]="passwordStrength === 'weak'"
                [class.strength-medium]="passwordStrength === 'medium'"
                [class.strength-strong]="passwordStrength === 'strong'"
                [style.width.%]="passwordStrengthPercentage"
              ></div>
            </div>
            <span class="strength-text" [class]="'strength-' + passwordStrength">
              {{ getPasswordStrengthText() }}
            </span>
          </div>

          <!-- Password Requirements -->
          <div class="password-requirements" *ngIf="passwordData.newPassword">
            <div class="requirement" [class.met]="hasMinLength()">
              <i [class]="hasMinLength() ? 'fa-solid fa-check' : 'fa-solid fa-times'"></i>
              <span>Mindestens 8 Zeichen</span>
            </div>
            <div class="requirement" [class.met]="hasUppercase()">
              <i [class]="hasUppercase() ? 'fa-solid fa-check' : 'fa-solid fa-times'"></i>
              <span>Mindestens ein Großbuchstabe</span>
            </div>
            <div class="requirement" [class.met]="hasLowercase()">
              <i [class]="hasLowercase() ? 'fa-solid fa-check' : 'fa-solid fa-times'"></i>
              <span>Mindestens ein Kleinbuchstabe</span>
            </div>
            <div class="requirement" [class.met]="hasNumber()">
              <i [class]="hasNumber() ? 'fa-solid fa-check' : 'fa-solid fa-times'"></i>
              <span>Mindestens eine Zahl</span>
            </div>
          </div>
        </div>

        <!-- Confirm New Password -->
        <div class="form-group">
          <label for="confirmPassword">Neues Passwort bestätigen *</label>
          <div class="password-input-container">
            <input
              id="confirmPassword"
              type="password"
              [(ngModel)]="passwordData.confirmPassword"
              name="confirmPassword"
              required
              placeholder="Passwort wiederholen"
              (input)="checkPasswordMatch()"
            >
            <button
              type="button"
              class="toggle-password"
              (click)="togglePasswordVisibility('confirm')"
              [attr.aria-label]="showPasswords.confirm ? 'Passwort verbergen' : 'Passwort anzeigen'"
            >
              <i [class]="showPasswords.confirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>

          <!-- Password Match Indicator -->
          <div class="password-match" *ngIf="passwordData.confirmPassword">
            <i [class]="passwordsMatch ? 'fa-solid fa-check-circle' : 'fa-solid fa-times-circle'"></i>
            <span [class]="passwordsMatch ? 'match' : 'no-match'">
              {{ passwordsMatch ? 'Passwörter stimmen überein' : 'Passwörter stimmen nicht überein' }}
            </span>
          </div>
        </div>

        <!-- Error Messages -->
        <div class="error-message" *ngIf="errorMessage">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Success Message -->
        <div class="success-message" *ngIf="successMessage">
          <i class="fa-solid fa-check-circle"></i>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            (click)="resetForm()"
            [disabled]="isLoading"
          >
            Zurücksetzen
          </button>
          <button
            type="submit"
            class="btn-primary"
            [disabled]="!passwordForm.valid || !passwordsMatch || isLoading"
          >
            <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
            <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
            {{ isLoading ? 'Wird gespeichert...' : 'Passwort ändern' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .password-change-container {
      max-width: 500px;
      margin: 0 auto;
    }

    .password-change-header {
      text-align: center;
      margin-bottom: var(--space-6);
    }

    .password-change-header h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-xl);
    }

    .password-change-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .password-change-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-group label {
      font-weight: 500;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .password-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input-container input {
      flex: 1;
      padding: var(--space-3) var(--space-10) var(--space-3) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
      transition: all var(--transition);
    }

    .password-input-container input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 10%, transparent);
    }

    .password-input-container input.ng-invalid.ng-touched {
      border-color: var(--color-danger);
    }

    /* Override validation styles after successful submission */
    .form-submitted .password-input-container input.ng-invalid {
      border-color: var(--color-border);
    }

    .form-submitted .password-input-container input.ng-invalid:focus {
      border-color: var(--color-primary);
    }

    .toggle-password {
      position: absolute;
      right: var(--space-3);
      background: none;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-1);
      border-radius: var(--radius-sm);
      transition: all var(--transition);
    }

    .toggle-password:hover {
      color: var(--color-text);
      background: var(--bg-light);
    }

    .password-strength {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-top: var(--space-2);
    }

    .strength-bar {
      flex: 1;
      height: 4px;
      background: var(--color-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      border-radius: var(--radius-sm);
      transition: all var(--transition);
    }

    .strength-weak { background: var(--color-danger); }
    .strength-medium { background: var(--color-warning); }
    .strength-strong { background: var(--color-success); }

    .strength-text {
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .strength-weak { color: var(--color-danger); }
    .strength-medium { color: var(--color-warning); }
    .strength-strong { color: var(--color-success); }

    .password-requirements {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-top: var(--space-3);
      padding: var(--space-3);
      background: var(--bg-light);
      border-radius: var(--radius-md);
    }

    .requirement {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-danger);
    }

    .requirement.met {
      color: var(--color-success);
    }

    .requirement i {
      font-size: 0.75rem;
      width: 16px;
    }

    .password-match {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-2);
      font-size: var(--text-sm);
    }

    .password-match i {
      font-size: 0.875rem;
    }

    .password-match .match {
      color: var(--color-success);
    }

    .password-match .no-match {
      color: var(--color-danger);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: color-mix(in oklab, var(--color-danger) 10%, white);
      border: 1px solid var(--color-danger);
      border-radius: var(--radius-md);
      color: var(--color-danger);
      font-size: var(--text-sm);
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: color-mix(in oklab, var(--color-success) 10%, white);
      border: 1px solid var(--color-success);
      border-radius: var(--radius-md);
      color: var(--color-success);
      font-size: var(--text-sm);
    }

    .form-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
      border: none;
      font-size: var(--text-sm);
    }

    .btn-primary {
      background: var(--color-primary-500);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-600);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--color-muted-100);
      border: 1px solid var(--color-border);
      color: var(--color-text);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--color-muted-200);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .password-requirements {
        padding: var(--space-2);
      }

      .form-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        justify-content: center;
      }
    }
  `]
})
export class PasswordChangeComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  @Output() passwordChanged = new EventEmitter<void>();

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showPasswords = {
    current: false,
    new: false,
    confirm: false
  };

  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  passwordStrengthPercentage = 0;
  passwordsMatch = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  hasBeenSubmitted = false;

  ngOnInit() {
    this.resetForm();
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    this.showPasswords[field] = !this.showPasswords[field];
  }

  checkPasswordStrength() {
    const password = this.passwordData.newPassword;
    if (!password) {
      this.passwordStrength = 'weak';
      this.passwordStrengthPercentage = 0;
      return;
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;

    // Character variety
    if (password.match(/[a-z]/)) score += 15;
    if (password.match(/[A-Z]/)) score += 15;
    if (password.match(/[0-9]/)) score += 15;
    if (password.match(/[^a-zA-Z0-9]/)) score += 10;

    // Complexity
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)) score += 10;

    this.passwordStrengthPercentage = Math.min(score, 100);

    if (score < 40) {
      this.passwordStrength = 'weak';
    } else if (score < 70) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  checkPasswordMatch() {
    this.passwordsMatch = this.passwordData.newPassword === this.passwordData.confirmPassword &&
                         this.passwordData.confirmPassword.length > 0;
  }

  getPasswordStrengthText(): string {
    switch (this.passwordStrength) {
      case 'weak': return 'Schwach';
      case 'medium': return 'Mittel';
      case 'strong': return 'Stark';
      default: return 'Schwach';
    }
  }

  hasMinLength(): boolean {
    return this.passwordData.newPassword.length >= 8;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.passwordData.newPassword);
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(this.passwordData.newPassword);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.passwordData.newPassword);
  }

  async changePassword() {
    if (!this.passwordsMatch || this.passwordData.newPassword.length < 8) {
      this.errorMessage = 'Bitte überprüfen Sie Ihre Eingaben.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasBeenSubmitted = true;

    try {
      const response = await this.authService.changePassword(
        this.passwordData.currentPassword,
        this.passwordData.newPassword
      ).toPromise();

      this.successMessage = 'Ihr Passwort wurde erfolgreich geändert.';
      this.toastService.success('Erfolg', 'Passwort wurde geändert');

      // Short delay before resetting to show success message
      setTimeout(() => {
        this.resetForm();
        this.passwordChanged.emit();
      }, 1500);

    } catch (error: any) {
      console.error('Password change error:', error);
      this.errorMessage = this.getErrorMessage(error);
      this.toastService.error('Fehler', this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.error) {
      const errorMsg = error.error.error.toLowerCase();

      if (errorMsg.includes('current password is incorrect')) {
        return 'Das aktuelle Passwort ist falsch.';
      }
      if (errorMsg.includes('password must be at least')) {
        return 'Das neue Passwort muss mindestens 8 Zeichen lang sein.';
      }
      if (errorMsg.includes('invalid')) {
        return 'Ungültige Eingabe.';
      }

      return error.error.error;
    }

    return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
  }

  resetForm() {
    // Reset form data
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    // Reset password visibility states
    this.showPasswords = {
      current: false,
      new: false,
      confirm: false
    };

    // Reset password validation states
    this.passwordStrength = 'weak';
    this.passwordStrengthPercentage = 0;
    this.passwordsMatch = false;

    // Reset form state
    this.hasBeenSubmitted = false;

    // Clear messages
    this.errorMessage = '';
    this.successMessage = '';

    // Force change detection for template updates
    this.cdr.detectChanges();
  }
}
