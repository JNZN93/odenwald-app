import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Allgemeine Geschäftsbedingungen (AGB)</h2>
          <button class="close-btn" (click)="close()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <section>
            <h3>1. Geltungsbereich</h3>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform ODNWLD liefert 
              durch Restaurant-Partner. Mit der Registrierung akzeptieren Sie diese Bedingungen.
            </p>
          </section>

          <section>
            <h3>2. Vertragsgegenstand</h3>
            <p>
              ODNWLD liefert stellt eine Online-Plattform zur Verfügung, über die Restaurants ihre Speisen 
              und Getränke zum Verkauf anbieten können. Die Plattform vermittelt zwischen Restaurants, 
              Kunden und Lieferfahrern.
            </p>
          </section>

          <section>
            <h3>3. Leistungen der Plattform</h3>
            <ul>
              <li>Bereitstellung der technischen Infrastruktur</li>
              <li>Vermittlung von Bestellungen</li>
              <li>Zahlungsabwicklung</li>
              <li>Kundensupport</li>
              <li>Marketing und Werbung</li>
            </ul>
          </section>

          <section>
            <h3>4. Pflichten des Restaurant-Partners</h3>
            <ul>
              <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
              <li>Einhaltung aller lebensmittelrechtlichen Vorschriften</li>
              <li>Rechtzeitige Bearbeitung von Bestellungen</li>
              <li>Qualitätssicherung der Speisen</li>
              <li>Angemessene Verpackung der Produkte</li>
            </ul>
          </section>

          <section>
            <h3>5. Preise und Zahlungen</h3>
            <p>
              Der Restaurant-Partner legt die Preise für seine Produkte selbst fest. Die Plattform behält 
              eine Provision von 15% pro vermittelter Bestellung ein. Die Auszahlung erfolgt wöchentlich 
              auf das hinterlegte Bankkonto.
            </p>
          </section>

          <section>
            <h3>6. Haftung</h3>
            <p>
              Der Restaurant-Partner haftet für die Qualität und Sicherheit der von ihm angebotenen Produkte. 
              Die Plattform haftet nicht für Mängel oder gesundheitliche Schäden, die durch die Produkte 
              des Partners verursacht werden.
            </p>
          </section>

          <section>
            <h3>7. Vertragslaufzeit und Kündigung</h3>
            <p>
              Der Vertrag wird auf unbestimmte Zeit geschlossen. Beide Parteien können den Vertrag mit 
              einer Frist von 30 Tagen zum Monatsende kündigen.
            </p>
          </section>

          <section>
            <h3>8. Datenschutz</h3>
            <p>
              Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und 
              den Vorgaben der DSGVO.
            </p>
          </section>

          <section>
            <h3>9. Schlussbestimmungen</h3>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist der Sitz der 
              ODNWLD GmbH. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Gültigkeit 
              der übrigen Bestimmungen unberührt.
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
      margin: 0;
      line-height: 1.6;
      color: var(--color-text);
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
export class TermsModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }
}

