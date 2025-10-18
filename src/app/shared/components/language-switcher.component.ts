import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="language-switcher">
      <select 
        [(ngModel)]="selectedLanguage" 
        (change)="onLanguageChange()"
        class="language-select"
        [title]="'translate' | translate"
      >
        <option 
          *ngFor="let lang of availableLanguages" 
          [value]="lang.code"
        >
          {{ lang.name }}
        </option>
      </select>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: flex;
      align-items: center;
    }

    .language-select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition);
      backdrop-filter: blur(10px);
    }

    .language-select:hover {
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.2);
    }

    .language-select:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.7);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
    }

    .language-select option {
      background: #374151;
      color: white;
    }

    @media (max-width: 768px) {
      .language-select {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
      }
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
  selectedLanguage: string = 'de';
  availableLanguages: { code: string; name: string }[] = [];

  constructor(private i18nService: I18nService) {}

  ngOnInit() {
    this.selectedLanguage = this.i18nService.getCurrentLanguage();
    this.availableLanguages = this.i18nService.getAvailableLanguages();
  }

  onLanguageChange() {
    this.i18nService.setLanguage(this.selectedLanguage);
  }
}
