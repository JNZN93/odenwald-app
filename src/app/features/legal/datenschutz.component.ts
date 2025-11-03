import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="legal-container">
        <div class="legal-header">
          <h1>Datenschutzerklärung</h1>
          <p class="legal-subtitle">Informationen zum Umgang mit Ihren Daten</p>
        </div>

        <div class="legal-content">
          <section>
            <h2>1. Verantwortliche Stelle</h2>
            <p>
              <strong>ODNWLD GmbH</strong><br>
              Musterstraße 123<br>
              12345 Musterstadt<br>
              Deutschland<br>
              E-Mail: datenschutz&#64;odnwld.de<br>
              Telefon: +49 123 456789
            </p>
          </section>

          <section>
            <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p>
              Wir erheben und speichern folgende Daten:
            </p>
            <h3>2.1 Bei der Registrierung als Kunde:</h3>
            <ul>
              <li>Name und Kontaktdaten (E-Mail, Telefon, Adresse)</li>
              <li>Lieferadressen</li>
              <li>Zahlungsinformationen (verschlüsselt)</li>
            </ul>
            <h3>2.2 Bei der Registrierung als Restaurant-Partner:</h3>
            <ul>
              <li>Name und Kontaktdaten (E-Mail, Telefon, Adresse)</li>
              <li>Restaurant-Informationen (Name, Adresse, Beschreibung)</li>
              <li>Bankdaten für Auszahlungen</li>
              <li>Gewerbliche Dokumente (Gewerbeschein, Steuernummer)</li>
              <li>Nutzungsdaten (Bestellungen, Umsätze)</li>
            </ul>
            <h3>2.3 Bei der Nutzung der Plattform:</h3>
            <ul>
              <li>Bestelldaten</li>
              <li>Nutzungsverhalten</li>
              <li>IP-Adressen (für Sicherheitszwecke)</li>
              <li>Cookies und ähnliche Technologien</li>
            </ul>
          </section>

          <section>
            <h2>3. Zweck der Datenverarbeitung</h2>
            <p>
              Die erhobenen Daten werden verwendet für:
            </p>
            <ul>
              <li>Bereitstellung und Verwaltung Ihres Accounts</li>
              <li>Abwicklung von Bestellungen</li>
              <li>Zahlungsabwicklung und Auszahlungen</li>
              <li>Kommunikation mit Ihnen</li>
              <li>Erfüllung rechtlicher Verpflichtungen</li>
              <li>Verbesserung unserer Dienstleistungen</li>
              <li>Marketing (nur mit Ihrer Einwilligung)</li>
            </ul>
          </section>

          <section>
            <h2>4. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von:
            </p>
            <ul>
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Einwilligung des Betroffenen</li>
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Erfüllung eines Vertrags</li>
              <li><strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Erfüllung einer rechtlichen Verpflichtung</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Berechtigtes Interesse</li>
            </ul>
          </section>

          <section>
            <h2>5. Weitergabe von Daten</h2>
            <p>
              Ihre Daten werden nur weitergegeben an:
            </p>
            <ul>
              <li><strong>Restaurants:</strong> Für die Abwicklung Ihrer Bestellungen</li>
              <li><strong>Lieferfahrer:</strong> Für die Zustellung Ihrer Bestellungen</li>
              <li><strong>Zahlungsdienstleister (Stripe):</strong> Für die Zahlungsabwicklung</li>
              <li><strong>Hosting-Provider:</strong> Für die IT-Infrastruktur</li>
              <li><strong>Behörden:</strong> Bei rechtlicher Verpflichtung</li>
            </ul>
            <p>
              Eine Weitergabe an Dritte zu Werbezwecken erfolgt nur mit Ihrer ausdrücklichen Einwilligung.
            </p>
          </section>

          <section>
            <h2>6. Speicherdauer</h2>
            <p>
              Wir speichern Ihre Daten so lange, wie:
            </p>
            <ul>
              <li>Sie Nutzer unserer Plattform sind</li>
              <li>Gesetzliche Aufbewahrungsfristen bestehen (z.B. 10 Jahre für Geschäftsunterlagen)</li>
              <li>Rechtliche Ansprüche geltend gemacht werden können</li>
            </ul>
            <p>
              Nach Ablauf der Speicherfristen werden die Daten gelöscht oder anonymisiert.
            </p>
          </section>

          <section>
            <h2>7. Ihre Rechte</h2>
            <p>
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul>
              <li><strong>Auskunft (Art. 15 DSGVO):</strong> Informationen über gespeicherte Daten</li>
              <li><strong>Berichtigung (Art. 16 DSGVO):</strong> Korrektur falscher Daten</li>
              <li><strong>Löschung (Art. 17 DSGVO):</strong> Löschung Ihrer Daten ("Recht auf Vergessenwerden")</li>
              <li><strong>Einschränkung (Art. 18 DSGVO):</strong> Einschränkung der Verarbeitung</li>
              <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Erhalt Ihrer Daten in maschinenlesbarem Format</li>
              <li><strong>Widerspruch (Art. 21 DSGVO):</strong> Widerspruch gegen die Verarbeitung</li>
              <li><strong>Widerruf der Einwilligung:</strong> Jederzeit mit Wirkung für die Zukunft</li>
              <li><strong>Beschwerde (Art. 77 DSGVO):</strong> Beschwerde bei einer Aufsichtsbehörde</li>
            </ul>
            <p>
              Um Ihre Rechte auszuüben, kontaktieren Sie uns unter: <strong>datenschutz&#64;odnwld.de</strong>
            </p>
          </section>

          <section>
            <h2>8. Cookies und Tracking</h2>
            <p>
              Wir verwenden Cookies und ähnliche Technologien für:
            </p>
            <ul>
              <li><strong>Funktionale Cookies:</strong> Technisch notwendig für die Funktionalität der Plattform</li>
              <li><strong>Analyse-Cookies:</strong> Zur Verbesserung unserer Dienstleistungen (nur mit Ihrer Einwilligung)</li>
              <li><strong>Session-Management:</strong> Für die Verwaltung Ihrer Sitzung</li>
            </ul>
            <p>
              Sie können Cookies in Ihren Browser-Einstellungen verwalten und löschen. 
              Bitte beachten Sie, dass einige Funktionen der Plattform ohne Cookies möglicherweise 
              nicht vollständig funktionieren.
            </p>
          </section>

          <section>
            <h2>9. Datensicherheit</h2>
            <p>
              Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten zu schützen:
            </p>
            <ul>
              <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
              <li>Zugriffsbeschränkungen und Authentifizierung</li>
              <li>Regelmäßige Sicherheits-Updates</li>
              <li>Datensicherungen</li>
              <li>Schulung unserer Mitarbeiter</li>
            </ul>
          </section>

          <section>
            <h2>10. Kontakt</h2>
            <p>
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br>
              <strong>E-Mail:</strong> datenschutz&#64;odnwld.de<br>
              <strong>Telefon:</strong> +49 123 456789<br>
              <strong>Post:</strong> ODNWLD GmbH, Musterstraße 123, 12345 Musterstadt
            </p>
          </section>

          <div class="legal-footer">
            <p>Stand: Januar 2025</p>
            <div class="legal-links">
              <a routerLink="/impressum">Impressum</a>
              <span>|</span>
              <a routerLink="/terms">AGB</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal-page {
      min-height: 100vh;
      background: var(--bg-light);
      padding: var(--space-8) var(--space-4);
    }

    .legal-container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .legal-header {
      background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-25));
      padding: var(--space-8) var(--space-6);
      border-bottom: 3px solid var(--color-primary);
      text-align: center;
    }

    .legal-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-primary-700);
    }

    .legal-subtitle {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-base);
    }

    .legal-content {
      padding: var(--space-8) var(--space-6);
    }

    .legal-content section {
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .legal-content section:last-of-type {
      border-bottom: none;
    }

    .legal-content h2 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
    }

    .legal-content h3 {
      margin: var(--space-4) 0 var(--space-2) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary-700);
    }

    .legal-content p {
      margin: 0 0 var(--space-3) 0;
      line-height: 1.7;
      color: var(--color-text);
    }

    .legal-content p:last-child {
      margin-bottom: 0;
    }

    .legal-content ul {
      margin: var(--space-3) 0;
      padding-left: var(--space-6);
      line-height: 1.8;
    }

    .legal-content li {
      margin-bottom: var(--space-2);
      color: var(--color-text);
    }

    .legal-content strong {
      font-weight: 600;
      color: var(--color-heading);
    }

    .legal-footer {
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 2px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .legal-footer p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .legal-links {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .legal-links a {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      transition: color var(--transition);
    }

    .legal-links a:hover {
      color: var(--color-primary-700);
      text-decoration: underline;
    }

    .legal-links span {
      color: var(--color-border);
    }

    @media (max-width: 768px) {
      .legal-page {
        padding: var(--space-4) var(--space-2);
      }

      .legal-header {
        padding: var(--space-6) var(--space-4);
      }

      .legal-content {
        padding: var(--space-6) var(--space-4);
      }

      .legal-footer {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class DatenschutzComponent {
}

