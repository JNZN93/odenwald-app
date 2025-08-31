import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      state('in', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('* => void', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="toast-container" *ngIf="toasts.length > 0">
      <div
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="toast-message"
        [ngClass]="toast.type"
        [@toastAnimation]="'in'"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <i [ngClass]="getIconClass(toast.type)"></i>
          </div>
          <div class="toast-text">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-description">{{ toast.message }}</div>
          </div>
          <div class="toast-actions">
            <button
              *ngIf="toast.action"
              class="toast-action-btn"
              (click)="executeAction(toast)"
            >
              {{ toast.action.label }}
            </button>
            <button
              class="toast-close-btn"
              (click)="closeToast(toast.id)"
              aria-label="Schließen"
            >
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Progress Bar für automatische Entfernung -->
        <div
          *ngIf="toast.duration && toast.duration > 0"
          class="toast-progress"
          [style.animation-duration.ms]="toast.duration"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000;
      max-width: 420px;
      pointer-events: none;
      font-family: var(--font-sans);
    }

    .toast-message {
      background: var(--color-primary-800);
      color: white;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: var(--space-4);
      overflow: hidden;
      pointer-events: auto;
      border-left: 4px solid;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .toast-message.success {
      border-left-color: var(--color-success);
      background: linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-800) 100%);
    }

    .toast-message.error {
      border-left-color: var(--color-danger);
      background: linear-gradient(135deg, var(--color-danger) 0%, #b91c1c 100%);
    }

    .toast-message.warning {
      border-left-color: var(--color-warning);
      background: linear-gradient(135deg, var(--color-warning) 0%, #d97706 100%);
    }

    .toast-message.info {
      border-left-color: var(--color-info);
      background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%);
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-5);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .toast-message.success .toast-icon {
      background: var(--color-success);
      color: white;
    }

    .toast-message.error .toast-icon {
      background: var(--color-danger);
      color: white;
    }

    .toast-message.warning .toast-icon {
      background: var(--color-warning);
      color: white;
    }

    .toast-message.info .toast-icon {
      background: var(--color-primary-500);
      color: white;
    }

    .toast-text {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 700;
      font-size: var(--text-lg);
      margin-bottom: var(--space-1);
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .toast-description {
      font-size: var(--text-base);
      color: rgba(255, 255, 255, 0.95);
      line-height: 1.5;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      font-weight: 400;
    }

    .toast-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
    }

    .toast-action-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .toast-action-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .toast-close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      color: rgba(255, 255, 255, 0.8);
      transition: all var(--transition);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      transform: scale(1.1);
    }

    .toast-progress {
      height: 4px;
      background: rgba(255, 255, 255, 0.8);
      animation: progress linear;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .toast-message.success .toast-progress {
      background: var(--color-success);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    .toast-message.error .toast-progress {
      background: var(--color-danger);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    .toast-message.warning .toast-progress {
      background: var(--color-warning);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    .toast-message.info .toast-progress {
      background: linear-gradient(90deg, var(--color-primary-400) 0%, var(--color-primary-600) 100%);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    /* Animations */

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .toast-container {
        left: 16px;
        right: 16px;
        max-width: none;
        top: 20px;
      }

      .toast-content {
        gap: var(--space-3);
        padding: var(--space-4);
      }

      .toast-icon {
        width: 28px;
        height: 28px;
        font-size: 13px;
      }

      .toast-title {
        font-size: var(--text-base);
      }

      .toast-description {
        font-size: var(--text-sm);
      }

      .toast-actions {
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-1);
      }

      .toast-action-btn {
        align-self: stretch;
        text-align: center;
        font-size: var(--text-xs);
      }

      .toast-close-btn {
        width: 28px;
        height: 28px;
        font-size: 12px;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  trackByToastId(index: number, toast: ToastMessage): string {
    return toast.id;
  }

  getIconClass(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'fa-solid fa-check-circle';
      case 'error':
        return 'fa-solid fa-exclamation-circle';
      case 'warning':
        return 'fa-solid fa-exclamation-triangle';
      case 'info':
        return 'fa-solid fa-info-circle';
      default:
        return 'fa-solid fa-info-circle';
    }
  }

  executeAction(toast: ToastMessage) {
    if (toast.action?.callback) {
      toast.action.callback();
    }
    this.closeToast(toast.id);
  }

  closeToast(toastId: string) {
    this.toastService.remove(toastId);
  }
}
