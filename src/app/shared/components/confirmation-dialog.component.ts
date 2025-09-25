import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationDialog } from '../../core/services/confirmation.service';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out')
      ]),
      transition('* => void', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ],
  template: `
    <div class="confirmation-overlay" *ngIf="dialog" (click)="cancel()" [@fadeInOut]>
      <div class="confirmation-dialog" (click)="$event.stopPropagation()" [ngClass]="dialog.type">
        <div class="dialog-header">
          <div class="dialog-icon">
            <i [ngClass]="getIconClass(dialog.type)"></i>
          </div>
          <h2 class="dialog-title">{{ dialog.title }}</h2>
        </div>

        <div class="dialog-content">
          <p class="dialog-message">{{ dialog.message }}</p>
        </div>

        <div class="dialog-actions">
          <button
            *ngIf="dialog.showCancel"
            type="button"
            class="btn-cancel"
            (click)="cancel()"
          >
            {{ dialog.cancelText }}
          </button>
          <button
            type="button"
            class="btn-confirm"
            [ngClass]="dialog.type"
            (click)="accept()"
          >
            {{ dialog.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(2px);
    }

    .confirmation-dialog {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      max-width: 450px;
      width: 90%;
      overflow: hidden;
      animation: slideIn 0.2s ease-out;
    }

    .confirmation-dialog.danger {
      border-left: 4px solid var(--color-danger);
    }

    .confirmation-dialog.warning {
      border-left: 4px solid var(--color-primary-500);
    }

    .confirmation-dialog.info {
      border-left: 4px solid var(--color-info);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .dialog-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .confirmation-dialog.danger .dialog-icon {
      background: var(--color-danger-50);
      color: var(--color-danger);
    }

    .confirmation-dialog.warning .dialog-icon {
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }

    .confirmation-dialog.info .dialog-icon {
      background: var(--color-info-50);
      color: var(--color-info);
    }

    .confirmation-dialog.default .dialog-icon {
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }

    .dialog-title {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .dialog-content {
      padding: var(--space-6);
    }

    .dialog-message {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-base);
      line-height: 1.5;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .btn-cancel,
    .btn-confirm {
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      border: none;
      font-size: var(--text-sm);
    }

    .btn-cancel {
      background: var(--color-muted-100);
      color: var(--color-muted-600);
      border: 1px solid var(--color-border);
    }

    .btn-cancel:hover {
      background: var(--color-muted-200);
    }

    .btn-confirm {
      background: var(--color-primary-500);
      color: white;
    }

    .btn-confirm:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .btn-confirm.danger {
      background: var(--color-danger);
    }

    .btn-confirm.danger:hover:not(:disabled) {
      background: var(--color-danger-600);
    }

    .btn-confirm.warning {
      background: var(--color-primary-600);
    }

    .btn-confirm.warning:hover:not(:disabled) {
      background: var(--color-primary-700);
    }

    .btn-confirm.info {
      background: var(--color-info);
    }

    .btn-confirm.info:hover:not(:disabled) {
      background: var(--color-info-600);
    }

    /* Animations */
    @keyframes slideIn {
      from {
        transform: scale(0.9) translateY(-20px);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .confirmation-dialog {
        margin: var(--space-4);
        width: calc(100% - 2 * var(--space-4));
      }

      .dialog-header {
        padding: var(--space-4);
        gap: var(--space-2);
      }

      .dialog-icon {
        width: 40px;
        height: 40px;
        font-size: 16px;
      }

      .dialog-title {
        font-size: var(--text-base);
      }

      .dialog-content {
        padding: var(--space-4);
      }

      .dialog-actions {
        padding: var(--space-4);
        flex-direction: column;
      }

      .btn-cancel,
      .btn-confirm {
        width: 100%;
        padding: var(--space-4);
      }
    }
  `]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  dialog: ConfirmationDialog | null = null;
  private subscription!: Subscription;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.subscription = this.confirmationService.dialog$.subscribe(dialog => {
      this.dialog = dialog;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getIconClass(type?: string): string {
    switch (type) {
      case 'danger':
        return 'fa-solid fa-exclamation-triangle';
      case 'warning':
        return 'fa-solid fa-shopping-cart';
      case 'info':
        return 'fa-solid fa-info-circle';
      default:
        return 'fa-solid fa-question-circle';
    }
  }

  accept(): void {
    this.confirmationService.accept();
  }

  cancel(): void {
    this.confirmationService.cancel();
  }
}
