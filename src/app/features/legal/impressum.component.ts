import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="legal-container">
        <div class="legal-header">
          <h1>Impressum</h1>
          <p class="legal-subtitle">Angaben gemäß § 5 TMG</p>
        </div>

        <div class="legal-content">
          <section>
            <h2>Verantwortlich für den Inhalt</h2>
            <p>
              <strong>ODNWLD GmbH</strong><br>
              Musterstraße 123<br>
              12345 Musterstadt<br>
              Deutschland
            </p>
          </section>

          <section>
            <h2>Kontakt</h2>
            <p>
              <strong>E-Mail:</strong> info&#64;odnwld.de<br>
              <strong>Telefon:</strong> +49 123 456789<br>
              <strong>Fax:</strong> +49 123 456788
            </p>
          </section>

          <section>
            <h2>Geschäftsführung</h2>
            <p>
              Max Mustermann<br>
              Musterstraße 123<br>
              12345 Musterstadt
            </p>
          </section>

          <section>
            <h2>Registereintrag</h2>
            <p>
              <strong>Registergericht:</strong> Amtsgericht Musterstadt<br>
              <strong>Registernummer:</strong> HRB 12345<br>
              <strong>Umsatzsteuer-ID:</strong> DE123456789
            </p>
          </section>

          <section>
            <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Max Mustermann<br>
              Musterstraße 123<br>
              12345 Musterstadt
            </p>
          </section>

          <section>
            <h2>Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten 
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als 
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde 
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige 
              Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den 
              allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch 
              erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei 
              Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend 
              entfernen.
            </p>
          </section>

          <section>
            <h2>Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen 
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der 
              Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf 
              mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der 
              Verlinkung nicht erkennbar.
            </p>
            <p>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete 
              Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von 
              Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>

          <section>
            <h2>Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art 
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
              Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind 
              nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
            <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die 
              Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche 
              gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, 
              bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen 
              werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>

          <div class="legal-footer">
            <p>Stand: Januar 2025</p>
            <div class="legal-links">
              <a routerLink="/datenschutz">Datenschutz</a>
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

    .legal-content p {
      margin: 0 0 var(--space-3) 0;
      line-height: 1.7;
      color: var(--color-text);
    }

    .legal-content p:last-child {
      margin-bottom: 0;
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
export class ImpressumComponent {
}

