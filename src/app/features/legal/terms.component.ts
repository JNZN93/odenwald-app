import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="legal-container">
        <div class="legal-header">
          <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p class="legal-subtitle">Bedingungen für die Nutzung unserer Plattform</p>
        </div>

        <div class="legal-content">
          <section>
            <h2>1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform ODNWLD liefert 
              durch Restaurant-Partner. Mit der Registrierung akzeptieren Sie diese Bedingungen.
            </p>
          </section>

          <section>
            <h2>2. Vertragsgegenstand</h2>
            <p>
              ODNWLD liefert stellt eine Online-Plattform zur Verfügung, über die Restaurants ihre Speisen 
              und Getränke zum Verkauf anbieten können. Die Plattform vermittelt zwischen Restaurants, 
              Kunden und Lieferfahrern.
            </p>
          </section>

          <section>
            <h2>3. Leistungen der Plattform</h2>
            <ul>
              <li>Bereitstellung der technischen Infrastruktur</li>
              <li>Vermittlung von Bestellungen</li>
              <li>Zahlungsabwicklung</li>
              <li>Kundensupport</li>
              <li>Marketing und Werbung</li>
            </ul>
          </section>

          <section>
            <h2>4. Pflichten des Restaurant-Partners</h2>
            <ul>
              <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
              <li>Einhaltung aller lebensmittelrechtlichen Vorschriften</li>
              <li>Rechtzeitige Bearbeitung von Bestellungen</li>
              <li>Qualitätssicherung der Speisen</li>
              <li>Angemessene Verpackung der Produkte</li>
            </ul>
          </section>

          <section>
            <h2>5. Preise und Zahlungen</h2>
            <p>
              Der Restaurant-Partner legt die Preise für seine Produkte selbst fest. Die Plattform behält 
              eine Provision von 15% pro vermittelter Bestellung ein. Die Auszahlung erfolgt wöchentlich 
              auf das hinterlegte Bankkonto.
            </p>
          </section>

          <section>
            <h2>6. Haftung</h2>
            <p>
              Der Restaurant-Partner haftet für die Qualität und Sicherheit der von ihm angebotenen Produkte. 
              Die Plattform haftet nicht für Mängel oder gesundheitliche Schäden, die durch die Produkte 
              des Partners verursacht werden.
            </p>
          </section>

          <section>
            <h2>7. Vertragslaufzeit und Kündigung</h2>
            <p>
              Der Vertrag wird auf unbestimmte Zeit geschlossen. Beide Parteien können den Vertrag mit 
              einer Frist von 30 Tagen zum Monatsende kündigen.
            </p>
          </section>

          <section>
            <h2>8. Datenschutz</h2>
            <p>
              Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und 
              den Vorgaben der DSGVO.
            </p>
          </section>

          <section>
            <h2>9. Schlussbestimmungen</h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist der Sitz der 
              ODNWLD GmbH. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Gültigkeit 
              der übrigen Bestimmungen unberührt.
            </p>
          </section>

          <div class="legal-footer">
            <p>Stand: Januar 2025</p>
            <div class="legal-links">
              <a routerLink="/impressum">Impressum</a>
              <span>|</span>
              <a routerLink="/datenschutz">Datenschutz</a>
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
export class TermsComponent {
}

