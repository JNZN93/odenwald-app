import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="star-rating" [class.disabled]="disabled">
      <div class="stars-container">
        <button
          *ngFor="let star of stars; let i = index"
          type="button"
          class="star"
          [class.filled]="i < rating"
          [class.hover]="i < hoverRating"
          [disabled]="disabled"
          (click)="onStarClick(i + 1)"
          (mouseenter)="onMouseEnter(i + 1)"
          (mouseleave)="onMouseLeave()"
          [attr.aria-label]="'Rate ' + (i + 1) + ' out of 5 stars'"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                  fill="currentColor" 
                  stroke="currentColor" 
                  stroke-width="1.5" 
                  stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="rating-text" *ngIf="showText">
        <span class="rating-value">{{ rating }}/5</span>
        <span class="rating-label">{{ getRatingLabel(rating) }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./star-rating.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true
    }
  ]
})
export class StarRatingComponent implements ControlValueAccessor {
  @Input() maxStars = 5;
  @Input() disabled = false;
  @Input() showText = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() ratingChange = new EventEmitter<number>();

  rating = 0;
  hoverRating = 0;
  stars: number[] = [];

  private onChange = (value: number) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.stars = Array(this.maxStars).fill(0).map((_, i) => i);
  }

  onStarClick(starRating: number) {
    if (this.disabled) return;
    
    this.rating = starRating;
    this.hoverRating = 0;
    this.onChange(starRating);
    this.ratingChange.emit(starRating);
  }

  onMouseEnter(starRating: number) {
    if (this.disabled) return;
    this.hoverRating = starRating;
  }

  onMouseLeave() {
    if (this.disabled) return;
    this.hoverRating = 0;
  }

  getRatingLabel(rating: number): string {
    const labels = {
      1: 'Sehr schlecht',
      2: 'Schlecht', 
      3: 'Okay',
      4: 'Gut',
      5: 'Ausgezeichnet'
    };
    return labels[rating as keyof typeof labels] || '';
  }

  // ControlValueAccessor implementation
  writeValue(value: number): void {
    this.rating = value || 0;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
