import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService, LoyaltyData } from '../../core/services/orders.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-loyalty-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loyalty-cards-section">
      <h3 class="section-title">Meine Stempelkarten</h3>

      <div *ngIf="loyaltyData$ | async as loyaltyResponse; else loading">
        <div *ngIf="loyaltyResponse.loyalty.length > 0; else noLoyalty">
          <div class="loyalty-grid">
            <div *ngFor="let loyalty of loyaltyResponse.loyalty" class="loyalty-card">
              <div class="card-header">
                <h4>{{ loyalty.restaurant_name }}</h4>
                <div class="card-actions">
                  <button
                    *ngIf="loyalty.can_redeem"
                    class="redeem-btn"
                    (click)="onRedeemClick(loyalty)"
                  >
                    {{ loyalty.discount_percent }}% Rabatt einlösen
                  </button>
                </div>
              </div>

              <div class="stamps-container">
                <div class="stamps-grid">
                  <div
                    *ngFor="let i of [].constructor(loyalty.stamps_required); let stampIndex = index"
                    class="stamp"
                    [class.filled]="stampIndex < loyalty.current_stamps"
                    [class.can-redeem]="loyalty.can_redeem && stampIndex === loyalty.stamps_required - 1"
                  >
                    <div class="stamp-inner">
                      <svg *ngIf="stampIndex < loyalty.current_stamps" class="stamp-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span *ngIf="stampIndex >= loyalty.current_stamps" class="stamp-number">{{ stampIndex + 1 }}</span>
                    </div>
                  </div>
                </div>

                <div class="stamps-info">
                  <div class="stamps-count">
                    <span class="current">{{ loyalty.current_stamps }}</span>
                    <span class="separator">/</span>
                    <span class="required">{{ loyalty.stamps_required }}</span>
                    <span class="label">Stempel</span>
                  </div>
                </div>
              </div>

              <div class="loyalty-stats">
                <div class="stat-item">
                  <span class="stat-label">Gesammelt:</span>
                  <span class="stat-value">{{ loyalty.lifetime_earned }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Eingelöst:</span>
                  <span class="stat-value">{{ loyalty.lifetime_redeemed }}</span>
                </div>
              </div>

              <div *ngIf="loyalty.can_redeem" class="redeem-notice">
                <i class="fa-solid fa-gift"></i>
                <span>Du kannst {{ loyalty.discount_percent }}% Rabatt einlösen!</span>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noLoyalty>
          <div class="no-loyalty">
            <div class="no-loyalty-icon">
              <i class="fa-solid fa-ticket-alt"></i>
            </div>
            <h4>Noch keine Stempelkarten</h4>
            <p>Bestelle bei Restaurants, um Stempel zu sammeln und Rabatte zu erhalten.</p>
            <button class="btn-primary" (click)="onOrderClick()">
              Jetzt bestellen
            </button>
          </div>
        </ng-template>
      </div>

      <ng-template #loading>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Stempelkarten werden geladen...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .loyalty-cards-section {
      margin-top: var(--space-6);
    }

    .section-title {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-4);
    }

    .loyalty-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--space-4);
    }

    .loyalty-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .loyalty-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .card-header h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
      margin: 0;
    }

    .redeem-btn {
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
    }

    .redeem-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .stamps-container {
      margin-bottom: var(--space-4);
    }

    .stamps-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .stamp {
      aspect-ratio: 1;
      border: 2px solid var(--color-border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      transition: all var(--transition);
      position: relative;
    }

    .stamp.filled {
      background: var(--gradient-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .stamp.can-redeem {
      border-color: var(--color-success);
      box-shadow: 0 0 0 2px var(--color-success-light);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 2px var(--color-success-light); }
      50% { box-shadow: 0 0 0 4px var(--color-success-light); }
    }

    .stamp-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .stamp-icon {
      width: 20px;
      height: 20px;
    }

    .stamp-number {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-muted);
    }

    .stamps-info {
      text-align: center;
    }

    .stamps-count {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .current {
      font-weight: 700;
      color: var(--color-primary);
    }

    .required {
      font-weight: 600;
    }

    .loyalty-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);
    }

    .stat-item {
      text-align: center;
      flex: 1;
    }

    .stat-label {
      display: block;
      font-size: var(--text-xs);
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }

    .stat-value {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-heading);
    }

    .redeem-notice {
      background: var(--color-success-light);
      border: 1px solid var(--color-success);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-success);
      font-weight: 600;
    }

    .redeem-notice i {
      font-size: var(--text-lg);
    }

    .no-loyalty {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      color: var(--color-muted);
    }

    .no-loyalty-icon {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .no-loyalty h4 {
      font-size: var(--text-lg);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .no-loyalty p {
      margin-bottom: var(--space-4);
      max-width: 300px;
      margin-left: auto;
      margin-right: auto;
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .loading-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top: 3px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-4);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .loyalty-grid {
        grid-template-columns: 1fr;
      }

      .card-header {
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-start;
      }

      .loyalty-stats {
        flex-direction: column;
        gap: var(--space-2);
      }
    }
  `]
})
export class LoyaltyCardsComponent implements OnInit {
  private ordersService = inject(OrdersService);

  loyaltyData$: Observable<{ count: number; loyalty: LoyaltyData[] }> = of({ count: 0, loyalty: [] });

  ngOnInit() {
    this.loadLoyaltyData();
  }

  private loadLoyaltyData() {
    this.loyaltyData$ = this.ordersService.getMyLoyalty().pipe(
      catchError(error => {
        console.error('Error loading loyalty data:', error);
        return of({ count: 0, loyalty: [] });
      })
    );
  }

  onRedeemClick(loyalty: LoyaltyData) {
    // TODO: Implement redemption logic
    console.log('Redeem loyalty for restaurant:', loyalty.restaurant_id);
    alert(`Du kannst ${loyalty.discount_percent}% Rabatt bei ${loyalty.restaurant_name} einlösen!`);
  }

  onOrderClick() {
    // TODO: Navigate to restaurants page
    console.log('Navigate to restaurants');
  }
}
