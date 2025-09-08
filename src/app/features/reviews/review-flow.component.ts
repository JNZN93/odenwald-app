import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewsService } from '../../core/services/reviews.service';
import { StarRatingComponent } from '../../shared/star-rating/star-rating.component';

@Component({
  selector: 'app-review-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StarRatingComponent],
  template: `
    <section class="review-flow">
      <div class="container">
        <div class="review-header">
          <h1>Bewertung abgeben</h1>
          <p class="review-subtitle">Teilen Sie Ihre Erfahrung mit uns</p>
        </div>

        <div *ngIf="!valid; else formTpl" class="error-state">
          <div class="error-icon">!</div>
          <h2>Ungültiger Link</h2>
          <p>Der Bewertungslink ist ungültig oder abgelaufen.</p>
        </div>

        <ng-template #formTpl>
          <div class="order-info" *ngIf="order">
            <div class="order-card">
              <div class="order-header">
                <h3>Bestellung</h3>
              </div>
              <div class="order-details">
                <div class="order-item">
                  <span class="label">Restaurant:</span>
                  <span class="value">{{ order.restaurant_name }}</span>
                </div>
                <div class="order-item" *ngIf="order.driver_id">
                  <span class="label">Fahrer:</span>
                  <span class="value">{{ order.driver_name || '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <form [formGroup]="reviewForm" (ngSubmit)="submit()" class="review-form">
            <!-- Restaurant Section -->
            <div class="form-section">
              <div class="section-header">
                <h3>Restaurant</h3>
                <p class="section-description">Bewerten Sie das Restaurant und die Bestellung</p>
              </div>

              <div class="rating-group">
                <label class="rating-label">
                  <span class="label-text">Gesamtbewertung</span>
                  <span class="label-required">*</span>
                </label>
                <app-star-rating
                  formControlName="restaurant_rating"
                  [showText]="true"
                  (ratingChange)="onRatingChange('restaurant_rating', $event)">
                </app-star-rating>
              </div>

              <div class="rating-group">
                <label class="rating-label">
                  <span class="label-text">Essensqualität</span>
                  <span class="label-required">*</span>
                </label>
                <app-star-rating 
                  formControlName="food_quality_rating"
                  [showText]="true">
                </app-star-rating>
              </div>

              <div class="rating-group">
                <label class="rating-label">
                  <span class="label-text">Lieferzeit</span>
                  <span class="label-required">*</span>
                </label>
                <app-star-rating 
                  formControlName="delivery_time_rating"
                  [showText]="true">
                </app-star-rating>
              </div>

              <div class="rating-group">
                <label class="rating-label">
                  <span class="label-text">Verpackung</span>
                  <span class="label-required">*</span>
                </label>
                <app-star-rating 
                  formControlName="packaging_rating"
                  [showText]="true">
                </app-star-rating>
              </div>

              <div class="rating-group">
                <label class="rating-label">
                  <span class="label-text">Service</span>
                  <span class="label-required">*</span>
                </label>
                <app-star-rating 
                  formControlName="service_rating"
                  [showText]="true">
                </app-star-rating>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-text">Kommentar zum Restaurant</span>
                  <span class="label-optional">(optional)</span>
                </label>
                <textarea 
                  formControlName="restaurant_comment"
                  class="form-textarea"
                  placeholder="Teilen Sie Ihre Gedanken zum Restaurant mit..."
                  rows="4">
                </textarea>
              </div>
            </div>

            <!-- Driver Section -->
            <div class="form-section" *ngIf="order?.driver_id">
              <div class="section-header">
                <h3>Fahrer</h3>
                <p class="section-description">Bewerten Sie den Lieferfahrer</p>
              </div>

              <div class="rating-group">
                <label class="rating-label">
                  <span class="label-text">Fahrerbewertung</span>
                  <span class="label-required">*</span>
                </label>
                <app-star-rating 
                  formControlName="driver_rating"
                  [showText]="true">
                </app-star-rating>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="label-text">Kommentar zum Fahrer</span>
                  <span class="label-optional">(optional)</span>
                </label>
                <textarea 
                  formControlName="driver_comment"
                  class="form-textarea"
                  placeholder="Teilen Sie Ihre Erfahrung mit dem Fahrer mit..."
                  rows="4">
                </textarea>
              </div>
            </div>

            <!-- Privacy Section -->
            <div class="form-section">
              <div class="privacy-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    formControlName="is_anonymous"
                    class="checkbox-input">
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">Anonyme Bewertung</span>
                </label>
                <p class="privacy-description">
                  Ihre Bewertung wird ohne Ihren Namen angezeigt
                </p>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary submit-btn"
                [disabled]="!isFormValid || submitting">
                <span *ngIf="!submitting">Bewertung senden</span>
                <span *ngIf="submitting" class="loading">
                  <span class="spinner"></span>
                  Wird gesendet...
                </span>
              </button>
            </div>
          </form>

          <div *ngIf="submitted" class="success-state">
            <div class="success-icon">✓</div>
            <h2>Vielen Dank!</h2>
            <p>Ihre Bewertung wurde erfolgreich übermittelt.</p>
          </div>
        </ng-template>
      </div>
    </section>
  `,
  styleUrls: ['./review-flow.component.scss']
})
export class ReviewFlowComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reviews = inject(ReviewsService);
  private fb = inject(FormBuilder);

  token = '';
  valid = false;
  order: any = null;
  submitting = false;
  submitted = false;

  // Custom validator for required ratings
  private atLeastOneRatingValidator(control: AbstractControl): ValidationErrors | null {
    const restaurantRating = control.get('restaurant_rating')?.value;
    const foodQualityRating = control.get('food_quality_rating')?.value;
    const deliveryTimeRating = control.get('delivery_time_rating')?.value;
    const packagingRating = control.get('packaging_rating')?.value;
    const serviceRating = control.get('service_rating')?.value;

    // At least restaurant rating must be provided (1-5)
    if (!restaurantRating || restaurantRating < 1 || restaurantRating > 5) {
      return { atLeastOneRating: true };
    }

    return null;
  }

  reviewForm = this.fb.group({
    restaurant_rating: [0, [Validators.min(0), Validators.max(5)]],
    food_quality_rating: [0, [Validators.min(0), Validators.max(5)]],
    delivery_time_rating: [0, [Validators.min(0), Validators.max(5)]],
    packaging_rating: [0, [Validators.min(0), Validators.max(5)]],
    service_rating: [0, [Validators.min(0), Validators.max(5)]],
    driver_rating: [0, [Validators.min(0), Validators.max(5)]],
    restaurant_comment: [''],
    driver_comment: [''],
    is_anonymous: [false]
  }, { validators: this.atLeastOneRatingValidator.bind(this) });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) return;
    this.reviews.validateToken(this.token).subscribe((resp: any) => {
      this.valid = !!resp?.valid;
      this.order = resp?.order;
    }, () => this.valid = false);
  }

  submit() {
    if (!this.token || this.reviewForm.invalid) {
      console.log('Form invalid:', this.reviewForm.errors);
      console.log('Form values:', this.reviewForm.value);
      return;
    }

    this.submitting = true;
    const formValue = this.reviewForm.value;

    // Filter out ratings that are 0 (not provided)
    const filteredValue = {
      ...formValue,
      food_quality_rating: formValue.food_quality_rating || undefined,
      delivery_time_rating: formValue.delivery_time_rating || undefined,
      packaging_rating: formValue.packaging_rating || undefined,
      service_rating: formValue.service_rating || undefined,
      driver_rating: formValue.driver_rating || undefined,
    };

    this.reviews.submitReviewWithToken(this.token, filteredValue).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        setTimeout(() => this.router.navigate(['/customer']), 2000);
      },
      error: () => {
        this.submitting = false;
        alert('Senden fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    });
  }

  // Debug method to check form validity
  get isFormValid(): boolean {
    return this.reviewForm.valid;
  }

  get formErrors() {
    return this.reviewForm.errors;
  }

  // Handle rating changes to ensure form validation updates
  onRatingChange(fieldName: string, value: number) {
    const control = this.reviewForm.get(fieldName);
    if (control) {
      control.setValue(value);
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }
}


