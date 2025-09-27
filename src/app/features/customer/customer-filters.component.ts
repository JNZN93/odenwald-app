import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerFiltersService, CustomerFiltersState } from '../../core/services/customer-filters.service';

@Component({
  selector: 'app-customer-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="filters-page">
      <div class="filters-hero header-gradient">
        <div class="hero-inner">
          <button type="button" class="icon-btn" (click)="goBack()" aria-label="Zurück">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" class="link-btn" (click)="clearAll()">Zurücksetzen</button>
        </div>
      </div>

      <div class="filters-content container">
        <div class="card">
          <h3 class="card-title">
            <i class="fa-solid fa-magnifying-glass"></i>
            Suche
          </h3>
          <div class="input-with-icon">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input id="search" type="text" [(ngModel)]="form.searchTerm" placeholder="z.B. Pizza, Sushi, vegan">
            <button *ngIf="form.searchTerm" class="clear-input" type="button" (click)="form.searchTerm = ''" aria-label="Suche löschen">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <p class="hint">Tipp: Wähle eine Kategorie unten, um schneller zu filtern.</p>
        </div>

        <div class="card">
          <h3 class="card-title">
            <i class="fa-solid fa-layer-group"></i>
            Kategorien
          </h3>
          <div class="chips-grid">
            <button
              *ngFor="let c of predefinedCategories"
              type="button"
              class="chip"
              [class.active]="form.category === c.name"
              (click)="toggleCategory(c.name)"
              [attr.aria-pressed]="form.category === c.name">
              <span class="icon">{{ c.icon }}</span>
              <span class="label">{{ c.name }}</span>
            </button>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">
            <i class="fa-solid fa-sliders"></i>
            Optionen
          </h3>
          <div class="toggles">
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="form.openNow">
              <span class="switch"></span>
              <span class="toggle-label">Jetzt geöffnet</span>
            </label>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="form.freeDelivery">
              <span class="switch"></span>
              <span class="toggle-label">Kostenlose Lieferung</span>
            </label>
          </div>
          <div class="select-row">
            <div class="select-group">
              <label for="minOrder">Mindestbestellwert</label>
              <div class="select-wrapper">
                <select id="minOrder" [(ngModel)]="form.minOrder">
                  <option value="all">Alle</option>
                  <option value="10">10,00 € oder weniger</option>
                  <option value="15">15,00 € oder weniger</option>
                </select>
                <i class="fa-solid fa-chevron-down"></i>
              </div>
            </div>
            <div class="select-group">
              <label for="rating">Bewertung</label>
              <div class="select-wrapper">
                <select id="rating" [(ngModel)]="form.ratingMin">
                  <option [ngValue]="0">Alle</option>
                  <option [ngValue]="3">ab 3★</option>
                  <option [ngValue]="4">ab 4★</option>
                  <option [ngValue]="4.5">ab 4.5★</option>
                </select>
                <i class="fa-solid fa-chevron-down"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="apply-section">
          <button type="button" class="apply-btn" (click)="apply()">
            <i class="fa-solid fa-check"></i>
            Anwenden
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
    .container { max-width: 940px; margin: 0 auto; padding: 0 1rem; }

    .filters-hero { 
      background: var(--gradient-primary);
      color: white; 
      padding: 0.75rem 0; 
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .hero-inner { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      gap: 1rem; 
      padding: 0 1rem;
    }
    @media (max-width: 768px) {
      .hero-inner { 
        padding: 0 1.5rem; 
      }
    }
    @media (min-width: 769px) {
      .filters-hero { 
        padding: 0.5rem 0; 
      }
      .hero-inner { 
        padding: 0 2rem; 
      }
    }
    .icon-btn { 
      background: rgba(255,255,255,0.1); 
      border: 1px solid rgba(255,255,255,0.2); 
      color: white; 
      border-radius: 999px; 
      padding: 0.5rem;
      transition: all 0.2s ease;
    }
    .icon-btn:hover {
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.3);
    }
    .icon-btn i { color: white; }
    .link-btn { 
      background: transparent; 
      border: none; 
      color: #fff; 
      text-decoration: underline;
      font-weight: 500;
    }

    .filters-content { display: flex; flex-direction: column; gap: 0.75rem; margin: 0.75rem 0 1.5rem; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
    .card-title { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #111827; font-weight: 600; }
    .card-title i { color: var(--color-primary-700, #1d4ed8); font-size: 0.85rem; }
    
    @media (min-width: 769px) {
      .filters-content { 
        gap: 0.5rem; 
        margin: 0.5rem 0 1rem; 
      }
      .card { 
        padding: 0.6rem; 
        border-radius: 6px; 
      }
      .card-title { 
        margin: 0 0 0.4rem 0; 
        font-size: 0.85rem; 
      }
    }

    .input-with-icon { position: relative; display: flex; align-items: center; }
    .input-with-icon i { position: absolute; left: 0.6rem; color: #6b7280; font-size: 0.85rem; }
    .input-with-icon input { width: 100%; padding: 0.5rem 1.8rem; padding-left: 1.6rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; font-size: 0.9rem; }
    .input-with-icon input:focus { outline: none; border-color: var(--color-primary-300, #93c5fd); background: #ffffff; box-shadow: 0 0 0 2px rgba(147,197,253,0.25); }
    .clear-input { position: absolute; right: 0.4rem; background: transparent; border: none; color: #6b7280; font-size: 0.8rem; }
    .hint { margin: 0.3rem 0 0 0; color: #6b7280; font-size: 0.8rem; }
    
    @media (min-width: 769px) {
      .input-with-icon i { left: 0.5rem; font-size: 0.8rem; }
      .input-with-icon input { 
        padding: 0.4rem 1.5rem; 
        padding-left: 1.3rem; 
        border-radius: 4px; 
        font-size: 0.85rem; 
      }
      .clear-input { right: 0.3rem; font-size: 0.75rem; }
      .hint { margin: 0.25rem 0 0 0; font-size: 0.75rem; }
    }

    .chips-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.4rem; }
    @media (min-width: 480px) { .chips-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (min-width: 768px) { .chips-grid { grid-template-columns: repeat(6, 1fr); } }
    @media (min-width: 1024px) { .chips-grid { grid-template-columns: repeat(8, 1fr); } }
    .chip { display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem; border: 1px solid #e5e7eb; background: #fff; padding: 0.4rem 0.5rem; border-radius: 999px; font-size: 0.85rem; transition: all 0.2s ease; }
    .chip .icon { font-size: 0.9rem; }
    .chip.active { background: var(--color-primary-700, #1d4ed8); color: #fff; border-color: var(--color-primary-700, #1d4ed8); box-shadow: 0 2px 8px rgba(29,78,216,0.2); }
    .chip:not(.active):hover { background: #f3f4f6; }
    
    @media (min-width: 769px) {
      .chips-grid { gap: 0.3rem; }
      .chip { 
        padding: 0.3rem 0.4rem; 
        font-size: 0.8rem; 
        border-radius: 6px; 
      }
      .chip .icon { font-size: 0.85rem; }
    }

    .toggles { display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-bottom: 0.5rem; }
    @media (min-width: 480px) { .toggles { grid-template-columns: 1fr 1fr; } }
    .toggle { display: inline-flex; align-items: center; gap: 0.5rem; user-select: none; }
    .toggle input { display: none; }
    .switch { width: 36px; height: 20px; background: #e5e7eb; border-radius: 999px; position: relative; transition: background 0.2s; }
    .switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.15); transition: transform 0.2s; }
    .toggle input:checked + .switch { background: var(--color-primary-600, #2563eb); }
    .toggle input:checked + .switch::after { transform: translateX(16px); }
    .toggle-label { color: #111827; font-size: 0.9rem; }
    
    @media (min-width: 769px) {
      .toggles { gap: 0.4rem; margin-bottom: 0.4rem; }
      .toggle { gap: 0.4rem; }
      .switch { width: 32px; height: 18px; }
      .switch::after { width: 14px; height: 14px; }
      .toggle input:checked + .switch::after { transform: translateX(14px); }
      .toggle-label { font-size: 0.85rem; }
    }

    .select-row { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 480px) { .select-row { grid-template-columns: 1fr 1fr; } }
    .select-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .select-group label { font-size: 0.85rem; color: #374151; font-weight: 500; }
    .select-wrapper { position: relative; }
    .select-wrapper select { width: 100%; appearance: none; -webkit-appearance: none; padding: 0.5rem 1.8rem 0.5rem 0.6rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.9rem; }
    .select-wrapper i { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; font-size: 0.8rem; }
    
    @media (min-width: 769px) {
      .select-row { gap: 0.5rem; }
      .select-group { gap: 0.25rem; }
      .select-group label { font-size: 0.8rem; }
      .select-wrapper select { 
        padding: 0.4rem 1.5rem 0.4rem 0.5rem; 
        border-radius: 4px; 
        font-size: 0.85rem; 
      }
      .select-wrapper i { right: 0.4rem; font-size: 0.75rem; }
    }

    .apply-section { margin-top: 0.75rem; }
    .apply-btn { 
      width: 100%; 
      background: var(--color-primary-700, #1d4ed8); 
      border: none; 
      color: #fff; 
      padding: 0.7rem; 
      border-radius: 8px; 
      font-weight: 600; 
      box-shadow: 0 4px 12px rgba(29,78,216,0.3); 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      gap: 0.4rem;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }
    .apply-btn:hover {
      background: var(--color-primary-800, #1e40af);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(29,78,216,0.35);
    }
    
    @media (min-width: 769px) {
      .apply-section { margin-top: 0.5rem; }
      .apply-btn { 
        padding: 0.6rem; 
        border-radius: 6px; 
        font-size: 0.85rem; 
        gap: 0.3rem;
      }
    }

    /* Utility: reuse global header gradient if available */
    .header-gradient { background: var(--gradient-primary); }
    `
  ]
})
export class CustomerFiltersComponent implements OnInit {
  private router = inject(Router);
  private filters = inject(CustomerFiltersService);

  form: CustomerFiltersState = {
    searchTerm: '',
    category: null,
    openNow: false,
    freeDelivery: false,
    minOrder: 'all',
    ratingMin: 0
  };

  predefinedCategories = [
    { name: 'Pizza', icon: '🍕' },
    { name: 'Burger', icon: '🍔' },
    { name: 'Sushi', icon: '🍣' },
    { name: 'Asiatisch', icon: '🥢' },
    { name: 'Italienisch', icon: '🍝' },
    { name: 'Döner & Kebab', icon: '🥙' },
    { name: 'Deutsch', icon: '🥨' },
    { name: 'Vegetarisch', icon: '🥗' },
    { name: 'Vegan', icon: '🌱' },
    { name: 'Fast Food', icon: '🍟' },
    { name: 'Desserts', icon: '🍰' },
    { name: 'Getränke', icon: '🥤' }
  ];

  ngOnInit(): void {
    this.form = { ...this.filters.getState() };
  }

  toggleCategory(name: string) {
    this.form.category = this.form.category === name ? null : name;
    if (this.form.category) {
      this.form.searchTerm = this.form.category;
    }
  }

  clearAll() {
    this.form = {
      searchTerm: '',
      category: null,
      openNow: false,
      freeDelivery: false,
      minOrder: 'all',
      ratingMin: 0
    };
  }

  apply() {
    this.filters.update({ ...this.form });
    this.router.navigate(['/customer']);
  }

  goBack() {
    this.router.navigate(['/customer']);
  }
}


