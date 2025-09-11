import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-stripe-onboarding-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width:600px;margin:40px auto;">
      <h2>Stripe Onboarding</h2>
      <p>Wir aktualisieren den Status Ihres Stripe-Kontos...</p>
      <p *ngIf="message">{{ message }}</p>
    </div>
  `
})
export class StripeOnboardingRedirectComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private restaurantsService = inject(RestaurantsService);
  private toast = inject(ToastService);

  message = '';

  ngOnInit(): void {
    const restaurantId = this.route.snapshot.queryParamMap.get('restaurant_id');
    if (!restaurantId) {
      this.message = 'Fehlende Restaurant-ID in der URL';
      return;
    }

    this.restaurantsService.getStripeStatus(restaurantId).subscribe({
      next: (status) => {
        this.message = `Status: ${status.onboarding_status} (Zahlungen: ${status.charges_enabled ? 'aktiv' : 'inaktiv'}, Auszahlungen: ${status.payouts_enabled ? 'aktiv' : 'inaktiv'})`;
        this.toast.success('Stripe', 'Onboarding-Status aktualisiert');
        // Redirect back to manager settings
        this.router.navigate(['/restaurant-manager/settings'], { replaceUrl: true });
      },
      error: () => {
        this.toast.error('Stripe', 'Status konnte nicht aktualisiert werden');
        this.router.navigate(['/restaurant-manager/settings'], { replaceUrl: true });
      }
    });
  }
}




