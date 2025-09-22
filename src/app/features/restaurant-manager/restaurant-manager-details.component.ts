import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';

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
        <h1>Restaurant-Details</h1>
        <p>Erstellen und bearbeiten Sie Abschnitte für die Kunden-Detailseite.</p>
      </div>

      <div *ngIf="!currentRestaurant" class="loading">Lade Restaurant...</div>

      <div *ngIf="currentRestaurant" class="content">
        <div class="toolbar">
          <button class="btn" (click)="addSection('text')">Text-Abschnitt hinzufügen</button>
          <button class="btn" (click)="addSection('gallery')">Galerie-Abschnitt hinzufügen</button>
          <button class="btn" (click)="addSection('video')">Video-Abschnitt hinzufügen</button>
        </div>

        <div class="sections-list" *ngIf="sections.length > 0; else empty">
          <div class="section-card" *ngFor="let s of sections; let i = index">
            <div class="section-header">
              <div class="left">
                <select [(ngModel)]="s.type">
                  <option value="text">Text</option>
                  <option value="gallery">Galerie</option>
                  <option value="video">Video</option>
                </select>
                <input type="text" placeholder="Titel (optional)" [(ngModel)]="s.title">
              </div>
              <div class="right">
                <label class="visibility">
                  <input type="checkbox" [(ngModel)]="s.visible"> Sichtbar
                </label>
                <input class="pos" type="number" [(ngModel)]="s.position" placeholder="#" min="0">
                <button class="icon" (click)="moveUp(i)" [disabled]="i===0">▲</button>
                <button class="icon" (click)="moveDown(i)" [disabled]="i===sections.length-1">▼</button>
                <button class="danger" (click)="removeSection(i)">Entfernen</button>
              </div>
            </div>

            <div class="section-body">
              <ng-container [ngSwitch]="s.type">
                <div *ngSwitchCase="'text'">
                  <textarea rows="6" placeholder="Inhalt" [(ngModel)]="s.content"></textarea>
                </div>
                <div *ngSwitchCase="'gallery'">
                  <div class="chips">
                    <div class="chip" *ngFor="let img of (s.images||[]); let j = index">
                      <input type="text" [(ngModel)]="s.images![j]" placeholder="Bild-URL">
                      <button class="icon" (click)="removeImage(i, j)">✕</button>
                    </div>
                  </div>
                  <button class="btn" (click)="addImage(i)">Bild-URL hinzufügen</button>
                  <p class="hint">Tipp: Nutzen Sie bereits hochgeladene Galerie-URLs aus dem Bilder-Tab.</p>
                </div>
                <div *ngSwitchCase="'video'">
                  <input type="text" [(ngModel)]="s.video_url" placeholder="Video-URL (YouTube/Vimeo)">
                </div>
              </ng-container>
            </div>
          </div>
        </div>
        <ng-template #empty>
          <div class="empty">Noch keine Abschnitte. Fügen Sie oben einen Abschnitt hinzu.</div>
        </ng-template>

        <div class="actions">
          <button class="primary" (click)="save()" [disabled]="saving">{{ saving ? 'Speichert...' : 'Speichern' }}</button>
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
        this.toast.success('Erfolg', 'Details gespeichert');
        this.saving = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Fehler', 'Details konnten nicht gespeichert werden');
        this.saving = false;
      }
    });
  }

  private reindex() {
    this.sections.forEach((s, i) => s.position = i);
  }
}


