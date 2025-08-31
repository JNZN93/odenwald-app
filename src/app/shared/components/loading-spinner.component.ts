import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [ngClass]="size" *ngIf="show">
      <div class="spinner" [ngClass]="variant">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-text" *ngIf="text">{{ text }}</div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
    }

    .loading-container.sm {
      gap: var(--space-2);
    }

    .loading-container.lg {
      gap: var(--space-4);
    }

    .spinner {
      position: relative;
      display: inline-block;
    }

    /* Small size */
    .loading-container.sm .spinner {
      width: 32px;
      height: 32px;
    }

    .loading-container.sm .spinner-ring {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }

    /* Medium size (default) */
    .spinner {
      width: 48px;
      height: 48px;
    }

    .spinner-ring {
      width: 48px;
      height: 48px;
      border: 4px solid transparent;
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
    }

    /* Large size */
    .loading-container.lg .spinner {
      width: 64px;
      height: 64px;
    }

    .loading-container.lg .spinner-ring {
      width: 64px;
      height: 64px;
      border-width: 5px;
    }

    /* Primary variant (default) */
    .spinner.primary .spinner-ring:nth-child(1) {
      border-top-color: var(--color-primary-500);
      animation: spin 1.5s linear infinite;
    }

    .spinner.primary .spinner-ring:nth-child(2) {
      border-top-color: var(--color-primary-400);
      animation: spin 1.5s linear infinite 0.2s;
    }

    .spinner.primary .spinner-ring:nth-child(3) {
      border-top-color: var(--color-primary-300);
      animation: spin 1.5s linear infinite 0.4s;
    }

    .spinner.primary .spinner-ring:nth-child(4) {
      border-top-color: var(--color-primary-200);
      animation: spin 1.5s linear infinite 0.6s;
    }

    /* Secondary variant */
    .spinner.secondary .spinner-ring:nth-child(1) {
      border-top-color: var(--color-secondary-500);
      animation: spin 1.5s linear infinite;
    }

    .spinner.secondary .spinner-ring:nth-child(2) {
      border-top-color: var(--color-secondary-400);
      animation: spin 1.5s linear infinite 0.2s;
    }

    .spinner.secondary .spinner-ring:nth-child(3) {
      border-top-color: var(--color-secondary-300);
      animation: spin 1.5s linear infinite 0.4s;
    }

    .spinner.secondary .spinner-ring:nth-child(4) {
      border-top-color: var(--color-secondary-200);
      animation: spin 1.5s linear infinite 0.6s;
    }

    /* White variant for dark backgrounds */
    .spinner.white .spinner-ring:nth-child(1) {
      border-top-color: rgba(255, 255, 255, 0.9);
      animation: spin 1.5s linear infinite;
    }

    .spinner.white .spinner-ring:nth-child(2) {
      border-top-color: rgba(255, 255, 255, 0.7);
      animation: spin 1.5s linear infinite 0.2s;
    }

    .spinner.white .spinner-ring:nth-child(3) {
      border-top-color: rgba(255, 255, 255, 0.5);
      animation: spin 1.5s linear infinite 0.4s;
    }

    .spinner.white .spinner-ring:nth-child(4) {
      border-top-color: rgba(255, 255, 255, 0.3);
      animation: spin 1.5s linear infinite 0.6s;
    }

    /* Pulse variant */
    .spinner.pulse .spinner-ring {
      animation: pulse 1.5s ease-in-out infinite;
    }

    .spinner.pulse .spinner-ring:nth-child(1) {
      background: var(--color-primary-500);
      border: none;
      border-radius: 50%;
      animation-delay: 0s;
    }

    .spinner.pulse .spinner-ring:nth-child(2) {
      background: var(--color-primary-400);
      border: none;
      border-radius: 50%;
      animation-delay: 0.2s;
    }

    .spinner.pulse .spinner-ring:nth-child(3) {
      background: var(--color-primary-300);
      border: none;
      border-radius: 50%;
      animation-delay: 0.4s;
    }

    .spinner.pulse .spinner-ring:nth-child(4) {
      background: var(--color-primary-200);
      border: none;
      border-radius: 50%;
      animation-delay: 0.6s;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(0.8);
        opacity: 0.6;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
    }

    .loading-text {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: 500;
      text-align: center;
    }

    .loading-container.sm .loading-text {
      font-size: var(--text-xs);
    }

    .loading-container.lg .loading-text {
      font-size: var(--text-base);
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() show: boolean = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'primary' | 'secondary' | 'white' | 'pulse' = 'primary';
  @Input() text?: string;
}
