import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wholesaler-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <h1>Analytics & Berichte</h1>
        <p>Analysieren Sie Ihre Verkaufsdaten und Trends</p>
      </div>

      <div class="analytics-content">
        <div class="coming-soon">
          <div class="coming-soon-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
              <path d="M13 2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
              <path d="M21 12h-6"/>
              <path d="M21 8h-6"/>
              <path d="M21 16h-6"/>
            </svg>
          </div>
          <h2>Analytics-Dashboard</h2>
          <p>Diese Funktion wird bald verfügbar sein. Hier können Sie detaillierte Berichte über Ihre Verkäufe, beliebteste Produkte und Kunden-Trends einsehen.</p>

          <div class="preview-features">
            <h3>Vorschau der Features:</h3>
            <ul>
              <li>📊 Umsatzberichte nach Zeitraum</li>
              <li>📈 Beliebteste Produkte</li>
              <li>👥 Top-Kunden Analyse</li>
              <li>📅 Saisonale Trends</li>
              <li>💰 Gewinnmargen-Berechnung</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .analytics-header {
      margin-bottom: var(--space-8);
    }

    .analytics-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .analytics-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .analytics-content {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      padding: var(--space-8);
    }

    .coming-soon {
      text-align: center;
      padding: var(--space-8);
    }

    .coming-soon-icon {
      margin-bottom: var(--space-4);
      color: var(--color-primary);
    }

    .coming-soon h2 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-2xl);
      color: var(--color-heading);
    }

    .coming-soon p {
      margin: 0 0 var(--space-6) 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .preview-features {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      text-align: left;
      max-width: 500px;
      margin: 0 auto;
    }

    .preview-features h3 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .preview-features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .preview-features li {
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text);
    }

    .preview-features li:last-child {
      border-bottom: none;
    }
  `]
})
export class WholesalerAnalyticsComponent implements OnInit {
  ngOnInit() {
    // Analytics logic would go here
  }
}
