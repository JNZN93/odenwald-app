import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Über uns</h3>
          <ul>
            <li><a routerLink="/customer">Restaurants</a></li>
            <li><a routerLink="/auth/register-restaurant">Restaurant werden</a></li>
            <li><a routerLink="/auth/register-wholesaler">Großhändler werden</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h3>Rechtliches</h3>
          <ul>
            <li><a routerLink="/impressum">Impressum</a></li>
            <li><a routerLink="/datenschutz">Datenschutz</a></li>
            <li><a routerLink="/terms">AGB</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h3>Support</h3>
          <ul>
            <li><a href="mailto:info@odnwld.de">Kontakt</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h3>Folgen Sie uns</h3>
          <div class="social-links">
            <a href="#" class="social-link" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="#" class="social-link" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" class="social-link" aria-label="Twitter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} ODNWLD liefert. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      padding: var(--space-8) var(--space-6) var(--space-4);
      margin-top: auto;
      flex-shrink: 0;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-8);
      margin-bottom: var(--space-8);
    }

    .footer-section h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-4) 0;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .footer-section ul li a {
      color: var(--color-text);
      text-decoration: none;
      font-size: var(--text-sm);
      transition: color var(--transition);
    }

    .footer-section ul li a:hover {
      color: var(--color-primary);
    }

    .social-links {
      display: flex;
      gap: var(--space-3);
    }

    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--color-surface-2);
      color: var(--color-text);
      text-decoration: none;
      transition: all var(--transition);
    }

    .social-link svg {
      width: 20px;
      height: 20px;
    }

    .social-link:hover {
      background: var(--color-primary);
      color: white;
      transform: translateY(-2px);
    }

    .footer-bottom {
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-4);
      text-align: center;
    }

    .footer-bottom p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: var(--space-6);
      }

      .footer-section {
        text-align: center;
      }

      .social-links {
        justify-content: center;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

