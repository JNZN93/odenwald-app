import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partner-contract-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Partner-Vertrag</h2>
          <button class="close-btn" (click)="close()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="contract-intro">
            <h3>Partnerschaftsvereinbarung</h3>
            <p class="contract-parties">
              zwischen <strong>ODNWLD GmbH</strong> (nachfolgend "Plattform") und dem 
              registrierten Restaurant-Partner (nachfolgend "Partner")
            </p>
          </div>

          <section>
            <h3>§ 1 Vertragsgegenstand</h3>
            <p>
              (1) Die Plattform betreibt eine Online-Plattform für die Vermittlung von Essensbestellungen. 
              Der Partner nutzt die Plattform, um seine Produkte über diese anzubieten und zu verkaufen.
            </p>
            <p>
              (2) Die Plattform stellt die technische Infrastruktur bereit, vermittelt Bestellungen und 
              organisiert die Lieferung der Produkte an Endkunden.
            </p>
          </section>

          <section>
            <h3>§ 2 Leistungen der Plattform</h3>
            <p>Die Plattform erbringt folgende Leistungen:</p>
            <ul>
              <li>Bereitstellung und Betrieb der Online-Plattform</li>
              <li>Präsentation des Restaurant-Angebots</li>
              <li>Vermittlung von Kundenbestellungen</li>
              <li>Abwicklung des Zahlungsverkehrs</li>
              <li>Organisation der Auslieferung</li>
              <li>Kundensupport und Reklamationsmanagement</li>
              <li>Marketing und Werbung</li>
            </ul>
          </section>

          <section>
            <h3>§ 3 Pflichten des Partners</h3>
            <p>Der Partner verpflichtet sich zu:</p>
            <ul>
              <li>Wahrheitsgemäßen und vollständigen Angaben bei der Registrierung</li>
              <li>Einhaltung aller gesetzlichen Vorschriften (Lebensmittelrecht, Hygienevorschriften)</li>
              <li>Bereitstellung aktueller und korrekter Produktinformationen</li>
              <li>Rechtzeitiger Bearbeitung eingehender Bestellungen</li>
              <li>Sicherstellung der Produktqualität und ordnungsgemäßen Verpackung</li>
              <li>Einhaltung der vereinbarten Lieferzeiten</li>
            </ul>
          </section>

          <section>
            <h3>§ 4 Vergütung und Abrechnung</h3>
            <p>
              (1) <strong>Provision:</strong> Die Plattform erhält eine Provision von <strong>15%</strong> 
              des Bruttobestellwerts (inkl. Mehrwertsteuer) für jede vermittelte Bestellung.
            </p>
            <p>
              (2) <strong>Auszahlung:</strong> Die Auszahlung des Nettoumsatzes (abzüglich Provision) erfolgt 
              wöchentlich jeweils montags für die Bestellungen der Vorwoche.
            </p>
            <p>
              (3) <strong>Zahlungsweise:</strong> Die Auszahlung erfolgt per Banküberweisung auf das vom 
              Partner bei Stripe hinterlegte Bankkonto.
            </p>
            <p>
              (4) Der Partner erhält monatlich eine detaillierte Abrechnung aller Transaktionen.
            </p>
          </section>

          <section>
            <h3>§ 5 Preisgestaltung</h3>
            <p>
              (1) Der Partner legt die Preise für seine Produkte selbständig fest.
            </p>
            <p>
              (2) Die Preise müssen angemessen sein und dürfen nicht höher sein als die Preise für 
              dieselben Produkte bei direktem Verkauf im Restaurant (sofern zutreffend).
            </p>
            <p>
              (3) Preisänderungen müssen rechtzeitig in der Plattform aktualisiert werden.
            </p>
          </section>

          <section>
            <h3>§ 6 Verfügbarkeit und Öffnungszeiten</h3>
            <p>
              (1) Der Partner legt seine Öffnungszeiten selbst fest und aktualisiert diese in der Plattform.
            </p>
            <p>
              (2) Der Partner ist verpflichtet, während der angegebenen Öffnungszeiten Bestellungen 
              anzunehmen und zu bearbeiten.
            </p>
            <p>
              (3) Bei vorübergehender Nichtverfügbarkeit (z.B. Betriebsurlaub) muss der Partner dies 
              rechtzeitig in der Plattform kennzeichnen.
            </p>
          </section>

          <section>
            <h3>§ 7 Qualitätssicherung</h3>
            <p>
              (1) Der Partner garantiert die Einhaltung aller lebensmittelrechtlichen und 
              hygienischen Vorschriften.
            </p>
            <p>
              (2) Der Partner stellt sicher, dass alle Produkte in einwandfreier Qualität 
              und ordnungsgemäßer Verpackung ausgeliefert werden.
            </p>
            <p>
              (3) Die Plattform behält sich vor, Qualitätskontrollen durchzuführen.
            </p>
          </section>

          <section>
            <h3>§ 8 Haftung und Gewährleistung</h3>
            <p>
              (1) Der Partner haftet für die Qualität und Sicherheit seiner Produkte sowie für alle 
              Schäden, die durch seine Produkte verursacht werden.
            </p>
            <p>
              (2) Die Plattform haftet nicht für Mängel oder Schäden, die aus der Tätigkeit des 
              Partners resultieren.
            </p>
            <p>
              (3) Der Partner stellt die Plattform von allen Ansprüchen Dritter frei, die aus 
              Rechtsverletzungen durch seine Produkte oder sein Verhalten resultieren.
            </p>
          </section>

          <section>
            <h3>§ 9 Bewertungen und Reklamationen</h3>
            <p>
              (1) Kunden können Bewertungen zu Bestellungen abgeben. Diese werden auf der Plattform 
              veröffentlicht.
            </p>
            <p>
              (2) Der Partner kann auf Bewertungen reagieren.
            </p>
            <p>
              (3) Reklamationen werden von der Plattform bearbeitet. Der Partner verpflichtet sich 
              zur Mitwirkung bei der Klärung.
            </p>
          </section>

          <section>
            <h3>§ 10 Vertragslaufzeit und Kündigung</h3>
            <p>
              (1) Der Vertrag wird auf unbestimmte Zeit geschlossen.
            </p>
            <p>
              (2) Beide Parteien können den Vertrag mit einer Frist von <strong>30 Tagen zum Monatsende</strong> 
              ordentlich kündigen.
            </p>
            <p>
              (3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
            </p>
            <p>
              (4) Die Kündigung bedarf der Textform (E-Mail genügt).
            </p>
          </section>

          <section>
            <h3>§ 11 Datenschutz</h3>
            <p>
              Beide Parteien verpflichten sich zur Einhaltung der datenschutzrechtlichen Bestimmungen, 
              insbesondere der DSGVO. Details regelt die separate Datenschutzerklärung.
            </p>
          </section>

          <section>
            <h3>§ 12 Geheimhaltung</h3>
            <p>
              Beide Parteien verpflichten sich, alle im Rahmen der Zusammenarbeit erlangten 
              vertraulichen Informationen geheim zu halten und nicht an Dritte weiterzugeben.
            </p>
          </section>

          <section>
            <h3>§ 13 Änderungen der Vertragsbedingungen</h3>
            <p>
              (1) Die Plattform behält sich vor, diese Vertragsbedingungen zu ändern.
            </p>
            <p>
              (2) Änderungen werden dem Partner mindestens 4 Wochen vor Inkrafttreten per E-Mail 
              mitgeteilt.
            </p>
            <p>
              (3) Widerspricht der Partner nicht innerhalb von 2 Wochen nach Zugang der Mitteilung, 
              gelten die geänderten Bedingungen als akzeptiert.
            </p>
          </section>

          <section>
            <h3>§ 14 Schlussbestimmungen</h3>
            <p>
              (1) Es gilt das Recht der Bundesrepublik Deutschland.
            </p>
            <p>
              (2) Gerichtsstand ist der Sitz der ODNWLD GmbH.
            </p>
            <p>
              (3) Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein oder werden, 
              so bleibt die Gültigkeit der übrigen Bestimmungen hiervon unberührt.
            </p>
            <p>
              (4) Änderungen und Ergänzungen dieses Vertrages bedürfen der Textform.
            </p>
          </section>

          <div class="signature-section">
            <p>
              Mit der Bestätigung im Onboarding-Prozess erklärt der Partner sein Einverständnis 
              mit diesem Partnervertrag und verpflichtet sich zur Einhaltung aller Bestimmungen.
            </p>
          </div>

          <div class="last-updated">
            Fassung: Januar 2025 | ODNWLD GmbH
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
      max-width: 900px;
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
      background: var(--bg-light-green);
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-primary-700);
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
      background: var(--color-surface);
      color: var(--color-text);
    }

    .close-btn svg {
      width: 24px;
      height: 24px;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-8);
      background: linear-gradient(to bottom, var(--color-surface), var(--bg-light));
    }

    .contract-intro {
      margin-bottom: var(--space-8);
      padding: var(--space-6);
      background: var(--bg-light-green);
      border: 2px solid var(--color-primary-300);
      border-radius: var(--radius-lg);
    }

    .contract-intro h3 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-primary-700);
      text-align: center;
    }

    .contract-parties {
      margin: 0;
      text-align: center;
      line-height: 1.8;
      color: var(--color-text);
    }

    section {
      margin-bottom: var(--space-8);
      padding: var(--space-6);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    section h3 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary-600);
      border-bottom: 2px solid var(--color-primary-200);
      padding-bottom: var(--space-2);
    }

    section p {
      margin: 0 0 var(--space-3) 0;
      line-height: 1.7;
      color: var(--color-text);
    }

    section p:last-child {
      margin-bottom: 0;
    }

    section ul {
      margin: var(--space-2) 0 0 0;
      padding-left: var(--space-6);
    }

    section li {
      margin-bottom: var(--space-2);
      line-height: 1.7;
      color: var(--color-text);
    }

    strong {
      font-weight: 600;
      color: var(--color-primary-700);
    }

    .signature-section {
      margin: var(--space-8) 0;
      padding: var(--space-6);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      border: 2px solid var(--color-primary-300);
      border-radius: var(--radius-lg);
    }

    .signature-section p {
      margin: 0;
      font-weight: 600;
      line-height: 1.7;
      color: var(--color-primary-700);
      text-align: center;
    }

    .last-updated {
      margin-top: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-light);
      border-left: 4px solid var(--color-primary-500);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-muted);
      text-align: center;
    }

    .modal-footer {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      background: var(--bg-light);
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

      .contract-intro,
      section,
      .signature-section {
        padding: var(--space-4);
      }

      .modal-footer {
        padding: var(--space-3) var(--space-4);
      }
    }
  `]
})
export class PartnerContractModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }
}


