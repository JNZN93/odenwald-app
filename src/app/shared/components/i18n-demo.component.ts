import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher.component';

@Component({
  selector: 'app-i18n-demo',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LanguageSwitcherComponent],
  template: `
    <div class="i18n-demo">
      <h2>{{ 'nav.overview' | translate }}</h2>
      <p>{{ 'desc.overview' | translate }}</p>
      
      <div class="demo-stats">
        <div class="stat-item">
          <span class="label">{{ 'stats.orders_today' | translate }}:</span>
          <span class="value">15</span>
        </div>
        <div class="stat-item">
          <span class="label">{{ 'stats.revenue_today' | translate }}:</span>
          <span class="value">€245.50</span>
        </div>
      </div>

      <div class="language-section">
        <h3>Sprachauswahl / Dil Seçimi</h3>
        <app-language-switcher></app-language-switcher>
      </div>

      <div class="translation-examples">
        <h3>Übersetzungsbeispiele / Çeviri Örnekleri</h3>
        <ul>
          <li><strong>{{ 'nav.orders' | translate }}:</strong> {{ 'desc.orders' | translate }}</li>
          <li><strong>{{ 'nav.menu' | translate }}:</strong> {{ 'desc.menu' | translate }}</li>
          <li><strong>{{ 'nav.customers' | translate }}:</strong> {{ 'desc.customers' | translate }}</li>
          <li><strong>{{ 'nav.settings' | translate }}:</strong> {{ 'desc.settings' | translate }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .i18n-demo {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #059669;
      margin-bottom: 1rem;
    }

    h3 {
      color: #374151;
      margin: 2rem 0 1rem 0;
    }

    .demo-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .stat-item {
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-weight: 500;
      color: #6b7280;
    }

    .value {
      font-weight: 700;
      color: #059669;
      font-size: 1.1rem;
    }

    .language-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      margin: 1.5rem 0;
    }

    .translation-examples {
      background: #fef3c7;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .translation-examples ul {
      list-style: none;
      padding: 0;
    }

    .translation-examples li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #fbbf24;
    }

    .translation-examples li:last-child {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .i18n-demo {
        margin: 1rem;
        padding: 1rem;
      }
    }
  `]
})
export class I18nDemoComponent {}
