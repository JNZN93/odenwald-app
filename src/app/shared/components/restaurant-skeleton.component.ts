import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restaurant-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="restaurant-skeleton-card" [ngClass]="{'animate': animate}" [style.animation-delay.ms]="index * 100">
      <!-- Image placeholder -->
      <div class="skeleton-image">
        <div class="skeleton-shimmer"></div>
      </div>

      <!-- Content placeholder -->
      <div class="skeleton-content">
        <!-- Header with name and rating -->
        <div class="skeleton-header">
          <div class="skeleton-name">
            <div class="skeleton-line skeleton-line-long"></div>
          </div>
          <div class="skeleton-rating">
            <div class="skeleton-line skeleton-line-short"></div>
          </div>
        </div>

        <!-- Description -->
        <div class="skeleton-description">
          <div class="skeleton-line skeleton-line-full"></div>
          <div class="skeleton-line skeleton-line-medium"></div>
        </div>

        <!-- Meta information -->
        <div class="skeleton-meta">
          <div class="skeleton-meta-item" *ngFor="let i of [1,2,3,4]">
            <div class="skeleton-icon"></div>
            <div class="skeleton-line skeleton-line-medium"></div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="skeleton-actions">
          <div class="skeleton-button skeleton-button-primary"></div>
          <div class="skeleton-button skeleton-button-secondary"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restaurant-skeleton-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      animation: skeleton-pulse 2s ease-in-out infinite;
    }

    .restaurant-skeleton-card.animate {
      animation: skeleton-fade-in 0.6s ease-out, skeleton-pulse 2s ease-in-out infinite 0.6s;
    }

    .skeleton-image {
      height: 200px;
      background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
      background-size: 200% 100%;
      position: relative;
      overflow: hidden;
    }

    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: shimmer 2s infinite;
    }

    .skeleton-content {
      padding: var(--space-6);
    }

    .skeleton-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
      gap: var(--space-3);
    }

    .skeleton-name {
      flex: 1;
    }

    .skeleton-rating {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .skeleton-description {
      margin-bottom: var(--space-4);
    }

    .skeleton-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
    }

    .skeleton-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .skeleton-icon {
      width: 16px;
      height: 16px;
      background: var(--color-border);
      border-radius: 2px;
      flex-shrink: 0;
    }

    .skeleton-actions {
      display: flex;
      gap: var(--space-3);
    }

    .skeleton-button {
      height: 44px;
      background: var(--color-border);
      border-radius: var(--radius-md);
      flex: 1;
    }

    .skeleton-button-primary {
      background: linear-gradient(90deg, var(--color-border) 25%, var(--color-primary-100) 50%, var(--color-border) 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite 0.5s;
    }

    .skeleton-button-secondary {
      background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite 1s;
    }

    /* Line variations */
    .skeleton-line {
      height: 16px;
      background: var(--color-border);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .skeleton-line::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: shimmer 2s infinite;
    }

    .skeleton-line-short {
      width: 60px;
    }

    .skeleton-line-medium {
      width: 120px;
    }

    .skeleton-line-long {
      width: 160px;
    }

    .skeleton-line-full {
      width: 100%;
    }

    /* Staggered animations */
    .skeleton-line:nth-child(1) .skeleton-line::before {
      animation-delay: 0s;
    }

    .skeleton-line:nth-child(2) .skeleton-line::before {
      animation-delay: 0.3s;
    }

    .skeleton-line:nth-child(3) .skeleton-line::before {
      animation-delay: 0.6s;
    }

    .skeleton-line:nth-child(4) .skeleton-line::before {
      animation-delay: 0.9s;
    }

    /* Keyframe animations */
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    @keyframes skeleton-fade-in {
      0% {
        opacity: 0;
        transform: translateY(10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes skeleton-pulse {
      0%, 100% {
        opacity: 0.7;
        transform: scale(1);
      }
      50% {
        opacity: 0.9;
        transform: scale(1.005);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .skeleton-actions {
        flex-direction: column;
      }

      .skeleton-button {
        height: 40px;
      }
    }
  `]
})
export class RestaurantSkeletonComponent {
  @Input() animate: boolean = true;
  @Input() index: number = 0;
}
