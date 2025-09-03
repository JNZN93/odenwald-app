import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wholesaler-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>Einstellungen</h1>
        <p>Konfigurieren Sie Ihre Konto- und Systemeinstellungen</p>
      </div>

      <div class="settings-content">
        <div class="coming-soon">
          <div class="coming-soon-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
              <path d="M1 12h6m6 0h6"/>
            </svg>
          </div>
          <h2>Einstellungen</h2>
          <p>Diese Funktion wird bald verfügbar sein. Hier können Sie Benachrichtigungseinstellungen, Sicherheitseinstellungen und Systempräferenzen verwalten.</p>

          <div class="preview-features">
            <h3>Vorschau der Features:</h3>
            <ul>
              <li>🔔 Benachrichtigungseinstellungen</li>
              <li>🔒 Passwort ändern</li>
              <li>📧 E-Mail-Einstellungen</li>
              <li>🌐 Sprache und Region</li>
              <li>🔧 Systempräferenzen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .settings-header {
      margin-bottom: var(--space-8);
    }

    .settings-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .settings-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .settings-content {
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
export class WholesalerSettingsComponent implements OnInit {
  ngOnInit() {
    // Settings logic would go here
  }
}
