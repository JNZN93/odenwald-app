import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/services/i18n.service';

type SectionType = 'text' | 'gallery' | 'video';

interface DetailsSection {
  id?: string;
  type: SectionType;
  title?: string;
  content?: string;
  images?: string[];
  video_url?: string;
  visible?: boolean;
  position?: number;
}

@Component({
  selector: 'app-restaurant-manager-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="details-editor">
      <div class="header">
        <h1>{{ i18n.translate('restaurant_details.title') }}</h1>
        <p>{{ i18n.translate('restaurant_details.description') }}</p>
      </div>

      <div *ngIf="!currentRestaurant" class="loading">{{ i18n.translate('restaurant_details.loading') }}</div>

      <div *ngIf="currentRestaurant" class="content">
        <div class="toolbar">
          <button class="btn" (click)="addSection('text')">{{ i18n.translate('restaurant_details.add_text_section') }}</button>
          <button class="btn" (click)="addSection('gallery')">{{ i18n.translate('restaurant_details.add_gallery_section') }}</button>
          <button class="btn" (click)="addSection('video')">{{ i18n.translate('restaurant_details.add_video_section') }}</button>
        </div>

        <div class="sections-list" *ngIf="sections.length > 0; else empty">
          <div class="section-card" *ngFor="let s of sections; let i = index">
            <div class="section-header">
              <div class="left">
                <select [(ngModel)]="s.type">
                  <option value="text">{{ i18n.translate('restaurant_details.section_type_text') }}</option>
                  <option value="gallery">{{ i18n.translate('restaurant_details.section_type_gallery') }}</option>
                  <option value="video">{{ i18n.translate('restaurant_details.section_type_video') }}</option>
                </select>
                <input type="text" [placeholder]="i18n.translate('restaurant_details.title_placeholder')" [(ngModel)]="s.title">
              </div>
              <div class="right">
                <label class="visibility">
                  <input type="checkbox" [(ngModel)]="s.visible"> {{ i18n.translate('restaurant_details.visible') }}
                </label>
                <input class="pos" type="number" [(ngModel)]="s.position" [placeholder]="i18n.translate('restaurant_details.position')" min="0">
                <button class="icon" (click)="moveUp(i)" [disabled]="i===0">▲</button>
                <button class="icon" (click)="moveDown(i)" [disabled]="i===sections.length-1">▼</button>
                <button class="danger" (click)="removeSection(i)">{{ i18n.translate('restaurant_details.remove') }}</button>
              </div>
            </div>

            <div class="section-body">
              <ng-container [ngSwitch]="s.type">
                <div *ngSwitchCase="'text'">
                  <textarea rows="6" [placeholder]="i18n.translate('restaurant_details.content_placeholder')" [(ngModel)]="s.content"></textarea>
                </div>
                <div *ngSwitchCase="'gallery'">
                  <div class="chips">
                    <div class="chip" *ngFor="let img of (s.images||[]); let j = index">
                      <input type="text" [(ngModel)]="s.images![j]" [placeholder]="i18n.translate('restaurant_details.image_url_placeholder')">
                      <button class="icon" (click)="removeImage(i, j)">✕</button>
                    </div>
                  </div>
                  <button class="btn" (click)="addImage(i)">{{ i18n.translate('restaurant_details.add_image_url') }}</button>
                  <p class="hint">{{ i18n.translate('restaurant_details.gallery_tip') }}</p>
                </div>
                <div *ngSwitchCase="'video'">
                  <input type="text" [(ngModel)]="s.video_url" [placeholder]="i18n.translate('restaurant_details.video_url_placeholder')">
                </div>
              </ng-container>
            </div>
          </div>
        </div>
        <ng-template #empty>
          <div class="empty">{{ i18n.translate('restaurant_details.no_sections') }}</div>
        </ng-template>

        <div class="actions">
          <button class="primary" (click)="save()" [disabled]="saving">{{ saving ? i18n.translate('restaurant_details.saving') : i18n.translate('restaurant_details.save') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .details-editor { max-width: 900px; margin: 0 auto; padding: var(--space-6) 0; }
    .header h1 { margin: 0 0 var(--space-2) 0; }
    .toolbar { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
    .btn { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 8px; background: white; cursor: pointer; }
    .primary { background: var(--color-primary-500); color: #fff; border: none; }
    .danger { background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; }
    .icon { padding: 6px 8px; border: 1px solid var(--color-border); background: white; border-radius: 6px; }
    .sections-list { display: flex; flex-direction: column; gap: var(--space-4); }
    .section-card { border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; background: #fff; }
    .section-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px; background: var(--bg-light); }
    .section-header .left { display: flex; gap: 8px; align-items: center; }
    .section-header .left select, .section-header .left input { padding: 6px 8px; border: 1px solid var(--color-border); border-radius: 6px; }
    .section-header .right { display: flex; gap: 8px; align-items: center; }
    .section-header .pos { width: 70px; }
    .section-body { padding: 12px; }
    textarea, input[type=text] { width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; }
    .chips { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
    .chip { display: flex; gap: 8px; align-items: center; }
    .empty { padding: 24px; text-align: center; color: var(--color-muted); }
    .actions { display: flex; justify-content: flex-end; margin-top: var(--space-4); }
  `]
})
export class RestaurantManagerDetailsComponent implements OnInit {
  private restaurantsService = inject(RestaurantsService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  public i18n = inject(I18nService);

  currentRestaurant: RestaurantDTO | null = null;
  sections: DetailsSection[] = [];
  saving = false;

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      if (!user) return;
      const restaurantId = user.tenant_id;
      this.restaurantsService.getRestaurantById(restaurantId).subscribe(r => {
        this.currentRestaurant = r;
        const incoming = (r as any).details_sections as DetailsSection[] | undefined;
        this.sections = (incoming || []).map(s => ({ visible: true, position: 0, ...s }))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      });
    });
  }

  addSection(type: SectionType) {
    const nextPos = (this.sections[this.sections.length - 1]?.position ?? -1) + 1;
    const base: DetailsSection = { type, title: '', visible: true, position: nextPos };
    if (type === 'gallery') base.images = [];
    this.sections.push(base);
  }

  removeSection(index: number) {
    this.sections.splice(index, 1);
    this.reindex();
  }

  moveUp(index: number) {
    if (index <= 0) return;
    [this.sections[index - 1], this.sections[index]] = [this.sections[index], this.sections[index - 1]];
    this.reindex();
  }

  moveDown(index: number) {
    if (index >= this.sections.length - 1) return;
    [this.sections[index + 1], this.sections[index]] = [this.sections[index], this.sections[index + 1]];
    this.reindex();
  }

  addImage(sectionIndex: number) {
    const s = this.sections[sectionIndex];
    if (!s.images) s.images = [];
    s.images.push('');
  }

  removeImage(sectionIndex: number, imageIndex: number) {
    const s = this.sections[sectionIndex];
    if (!s.images) return;
    s.images.splice(imageIndex, 1);
  }

  save() {
    if (!this.currentRestaurant) return;
    this.saving = true;
    const payload = {
      details_sections: this.sections.map((s, idx) => ({ ...s, position: idx }))
    } as any;
    this.restaurantsService.updateRestaurant(this.currentRestaurant.id, payload).subscribe({
      next: (updated) => {
        this.currentRestaurant = updated;
        this.toast.success(this.i18n.translate('common.success'), this.i18n.translate('restaurant_details.save'));
        this.saving = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.error(this.i18n.translate('common.error'), this.i18n.translate('restaurant_details.save'));
        this.saving = false;
      }
    });
  }

  private reindex() {
    this.sections.forEach((s, i) => s.position = i);
  }
}


