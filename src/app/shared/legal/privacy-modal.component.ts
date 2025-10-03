import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Datenschutzerklärung</h2>
          <button class="close-btn" (click)="close()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <section>
            <h3>1. Verantwortliche Stelle</h3>
            <p>
              <strong>ODNWLD GmbH</strong><br>
              Musterstraße 123<br>
              12345 Musterstadt<br>
              Deutschland<br>
              E-Mail: datenschutz&#64;odnwld.de
            </p>
          </section>

          <section>
            <h3>2. Erhebung und Speicherung personenbezogener Daten</h3>
            <p>
              Wir erheben und speichern folgende Daten bei der Registrierung als Restaurant-Partner:
            </p>
            <ul>
              <li>Name und Kontaktdaten (E-Mail, Telefon, Adresse)</li>
              <li>Restaurant-Informationen (Name, Adresse, Beschreibung)</li>
              <li>Bankdaten für Auszahlungen</li>
              <li>Gewerbliche Dokumente (Gewerbeschein, Steuernummer)</li>
              <li>Nutzungsdaten (Bestellungen, Umsätze)</li>
            </ul>
          </section>

          <section>
            <h3>3. Zweck der Datenverarbeitung</h3>
            <p>
              Die erhobenen Daten werden verwendet für:
            </p>
            <ul>
              <li>Bereitstellung und Verwaltung Ihres Partner-Accounts</li>
              <li>Abwicklung von Bestellungen</li>
              <li>Zahlungsabwicklung und Auszahlungen</li>
              <li>Kommunikation mit Ihnen</li>
              <li>Erfüllung rechtlicher Verpflichtungen</li>
              <li>Verbesserung unserer Dienstleistungen</li>
            </ul>
          </section>

          <section>
            <h3>4. Rechtsgrundlage</h3>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von:
            </p>
            <ul>
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
              <li>Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung)</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</li>
            </ul>
          </section>

          <section>
            <h3>5. Weitergabe von Daten</h3>
            <p>
              Ihre Daten werden nur weitergegeben an:
            </p>
            <ul>
              <li>Zahlungsdienstleister (Stripe) für Auszahlungen</li>
              <li>Hosting-Provider für IT-Infrastruktur</li>
              <li>Behörden bei rechtlicher Verpflichtung</li>
            </ul>
            <p>
              Eine Weitergabe an Dritte zu Werbezwecken erfolgt nicht.
            </p>
          </section>

          <section>
            <h3>6. Speicherdauer</h3>
            <p>
              Wir speichern Ihre Daten so lange, wie:
            </p>
            <ul>
              <li>Sie Partner unserer Plattform sind</li>
              <li>Gesetzliche Aufbewahrungsfristen bestehen (z.B. 10 Jahre für Geschäftsunterlagen)</li>
              <li>Rechtliche Ansprüche geltend gemacht werden können</li>
            </ul>
          </section>

          <section>
            <h3>7. Ihre Rechte</h3>
            <p>
              Sie haben folgende Rechte:
            </p>
            <ul>
              <li><strong>Auskunft:</strong> Informationen über gespeicherte Daten</li>
              <li><strong>Berichtigung:</strong> Korrektur falscher Daten</li>
              <li><strong>Löschung:</strong> Löschung Ihrer Daten ("Recht auf Vergessenwerden")</li>
              <li><strong>Einschränkung:</strong> Einschränkung der Verarbeitung</li>
              <li><strong>Datenübertragbarkeit:</strong> Erhalt Ihrer Daten in maschinenlesbarem Format</li>
              <li><strong>Widerspruch:</strong> Widerspruch gegen die Verarbeitung</li>
              <li><strong>Beschwerde:</strong> Beschwerde bei einer Aufsichtsbehörde</li>
            </ul>
          </section>

          <section>
            <h3>8. Cookies und Tracking</h3>
            <p>
              Wir verwenden Cookies und ähnliche Technologien für:
            </p>
            <ul>
              <li>Funktionale Cookies (technisch notwendig)</li>
              <li>Analyse-Cookies (mit Ihrer Einwilligung)</li>
              <li>Session-Management</li>
            </ul>
            <p>
              Sie können Cookies in Ihren Browser-Einstellungen verwalten.
            </p>
          </section>

          <section>
            <h3>9. Datensicherheit</h3>
            <p>
              Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten zu schützen:
            </p>
            <ul>
              <li>SSL/TLS-Verschlüsselung</li>
              <li>Zugriffsbeschränkungen</li>
              <li>Regelmäßige Sicherheits-Updates</li>
              <li>Datensicherungen</li>
            </ul>
          </section>

          <section>
            <h3>10. Kontakt</h3>
            <p>
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br>
              <strong>E-Mail:</strong> datenschutz&#64;odnwld.de<br>
              <strong>Telefon:</strong> +49 123 456789
            </p>
          </section>

          <div class="last-updated">
            Zuletzt aktualisiert: Januar 2025
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" (click)="close()">Schließen</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: var(--space-4);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-2xl);
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-heading);
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--space-2);
      color: var(--color-muted);
      transition: all var(--transition);
      border-radius: var(--radius-md);
    }

    .close-btn:hover {
      background: var(--bg-light);
      color: var(--color-text);
    }

    .close-btn svg {
      width: 24px;
      height: 24px;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
    }

    section {
      margin-bottom: var(--space-6);
    }

    section h3 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    section p {
      margin: 0 0 var(--space-3) 0;
      line-height: 1.6;
      color: var(--color-text);
    }

    section p:last-child {
      margin-bottom: 0;
    }

    section ul {
      margin: var(--space-2) 0 0 0;
      padding-left: var(--space-5);
    }

    section li {
      margin-bottom: var(--space-2);
      line-height: 1.6;
      color: var(--color-text);
    }

    strong {
      font-weight: 600;
      color: var(--color-heading);
    }

    .last-updated {
      margin-top: var(--space-8);
      padding: var(--space-3);
      background: var(--bg-light);
      border-left: 3px solid var(--color-primary-500);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .modal-footer {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
    }

    .btn-primary {
      padding: var(--space-3) var(--space-6);
      border: none;
      border-radius: var(--radius-lg);
      background: var(--gradient-primary);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-600) 25%, transparent);
    }

    @media (max-width: 768px) {
      .modal-content {
        max-height: 95vh;
      }

      .modal-header {
        padding: var(--space-4);
      }

      .modal-body {
        padding: var(--space-4);
      }

      .modal-footer {
        padding: var(--space-3) var(--space-4);
      }
    }
  `]
})
export class PrivacyModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }
}

