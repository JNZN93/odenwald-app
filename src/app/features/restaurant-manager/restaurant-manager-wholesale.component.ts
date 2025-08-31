import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-restaurant-manager-wholesale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wholesale-container">
      <div class="header">
        <h2>Großhandel Einkauf</h2>
        <p>Bestellen Sie Zutaten und Waren für Ihr Restaurant.</p>
      </div>

      <div class="content">
        <div class="info-card">
          <h3>Schnellzugriff</h3>
          <ul>
            <li><a href="#" (click)="$event.preventDefault()">Beliebte Artikel</a></li>
            <li><a href="#" (click)="$event.preventDefault()">Letzte Bestellungen</a></li>
            <li><a href="#" (click)="$event.preventDefault()">Lieferanten</a></li>
          </ul>
        </div>

        <div class="placeholder">
          <div class="icon">📦</div>
          <h4>Großhandel-Module in Vorbereitung</h4>
          <p>Hier können Sie bald Warenkörbe anlegen, Preise vergleichen und Bestellungen auslösen.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wholesale-container { max-width: 1200px; margin: 0 auto; }
    .header { margin-bottom: var(--space-6); }
    .header h2 { margin: 0 0 var(--space-2) 0; color: var(--color-heading); }
    .header p { margin: 0; color: var(--color-muted); }
    .content { display: grid; grid-template-columns: 300px 1fr; gap: var(--space-6); }
    .info-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); }
    .info-card h3 { margin: 0 0 var(--space-3) 0; font-size: var(--text-md); }
    .info-card ul { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-2); }
    .info-card a { color: var(--color-primary); text-decoration: none; }
    .info-card a:hover { text-decoration: underline; }
    .placeholder { background: var(--bg-light); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-8); text-align: center; }
    .placeholder .icon { font-size: 48px; margin-bottom: var(--space-3); }
    .placeholder h4 { margin: 0 0 var(--space-2) 0; }
    .placeholder p { margin: 0; color: var(--color-muted); }
    @media (max-width: 900px) { .content { grid-template-columns: 1fr; } }
  `]
})
export class RestaurantManagerWholesaleComponent {}


