import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ActivationInfo {
  driver: {
    name: string;
    username: string;
    vehicle_type: string;
    license_plate?: string;
  };
  tenant: {
    name: string;
  };
  expires_at: string;
}

@Component({
  selector: 'app-driver-activation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="activation-container">
      <div class="activation-card" *ngIf="!loading && activationInfo">
        <!-- Header -->
        <div class="activation-header">
          <i class="fa-solid fa-user-check"></i>
          <h1>Willkommen!</h1>
          <p>Aktivieren Sie Ihren Fahrer-Account</p>
        </div>

        <!-- Driver Info -->
        <div class="driver-preview">
          <div class="info-item">
            <label>Name:</label>
            <span>{{ activationInfo.driver.name }}</span>
          </div>
          <div class="info-item">
            <label>Restaurant:</label>
            <span>{{ activationInfo.tenant.name }}</span>
          </div>
          <div class="info-item">
            <label>Benutzername:</label>
            <span class="username">{{ activationInfo.driver.username }}</span>
          </div>
          <div class="info-item">
            <label>Fahrzeugtyp:</label>
            <span>{{ getVehicleTypeLabel(activationInfo.driver.vehicle_type) }}</span>
          </div>
        </div>

        <!-- Activation Form -->
        <form [formGroup]="activationForm" (ngSubmit)="activateAccount()" *ngIf="!activated">
          <div class="form-section">
            <h3>Passwort festlegen</h3>
            <p class="section-hint">Wählen Sie ein sicheres Passwort für Ihren Account</p>
            
            <div class="form-group">
              <label>Passwort *</label>
              <input 
                type="password" 
                formControlName="password"
                placeholder="Mindestens 8 Zeichen"
                [class.error]="isFieldInvalid('password')"
              />
              <small *ngIf="isFieldInvalid('password')" class="error-message">
                Passwort muss mindestens 8 Zeichen lang sein
              </small>
            </div>

            <div class="form-group">
              <label>Passwort wiederholen *</label>
              <input 
                type="password" 
                formControlName="confirmPassword"
                placeholder="Passwort bestätigen"
                [class.error]="isFieldInvalid('confirmPassword')"
              />
              <small *ngIf="passwordMismatch()" class="error-message">
                Passwörter stimmen nicht überein
              </small>
            </div>
          </div>

          <div class="form-section optional-section">
            <h3>Zusätzliche Informationen (optional)</h3>
            <p class="section-hint">Diese Angaben können Sie auch später in Ihrem Profil ergänzen</p>

            <div class="form-group">
              <label>Telefonnummer</label>
              <input 
                type="tel" 
                formControlName="phone"
                placeholder="+49 123 456789"
              />
            </div>
            
            <details class="vehicle-details-toggle">
              <summary>Fahrzeug-Details hinzufügen (optional)</summary>
              
              <div class="form-group">
                <label>Marke</label>
                <input 
                  type="text" 
                  formControlName="vehicleMake"
                  placeholder="z.B. VW, BMW, ..."
                />
              </div>

              <div class="form-group">
                <label>Modell</label>
                <input 
                  type="text" 
                  formControlName="vehicleModel"
                  placeholder="z.B. Golf, 3er, ..."
                />
              </div>

              <div class="form-group">
                <label>Farbe</label>
                <input 
                  type="text" 
                  formControlName="vehicleColor"
                  placeholder="z.B. Blau, Schwarz, ..."
                />
              </div>
            </details>
          </div>

          <button 
            type="submit" 
            class="btn-activate"
            [disabled]="activationForm.invalid || activating"
          >
            <i class="fa-solid fa-check" *ngIf="!activating"></i>
            <i class="fa-solid fa-spinner fa-spin" *ngIf="activating"></i>
            {{ activating ? 'Aktiviere...' : 'Account aktivieren' }}
          </button>
        </form>

        <!-- Success Message -->
        <div class="success-message" *ngIf="activated">
          <i class="fa-solid fa-check-circle"></i>
          <h2>Account aktiviert!</h2>
          <p>Ihr Account wurde erfolgreich aktiviert.</p>
          <p>Sie können sich jetzt einloggen.</p>
          <button class="btn-login" (click)="goToLogin()">
            <i class="fa-solid fa-sign-in-alt"></i>
            Zum Login
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Lade Informationen...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <h2>Ungültiger Link</h2>
        <p>{{ error }}</p>
        <button class="btn-secondary" (click)="goToLogin()">
          Zum Login
        </button>
      </div>
    </div>
  `,
  styles: [`
    .activation-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .activation-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .activation-header {
      text-align: center;
      margin-bottom: 30px;

      i {
        font-size: 4rem;
        color: #4CAF50;
        margin-bottom: 15px;
      }

      h1 {
        margin: 0 0 10px 0;
        font-size: 2rem;
        color: #333;
      }

      p {
        margin: 0;
        color: #666;
        font-size: 1.1rem;
      }
    }

    .driver-preview {
      background: #f5f5f5;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #e0e0e0;

        &:last-child {
          border-bottom: none;
        }

        label {
          font-weight: 600;
          color: #555;
        }

        span {
          color: #333;

          &.username {
            font-family: monospace;
            background: white;
            padding: 4px 12px;
            border-radius: 6px;
            font-weight: 600;
            color: #667eea;
          }
        }
      }
    }

    .form-section {
      margin-bottom: 30px;

      h3 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 1.2rem;
      }

      .section-hint {
        margin: 0 0 20px 0;
        color: #666;
        font-size: 0.9rem;
      }
    }

    .optional-section {
      background: #f9f9f9;
      border: 1px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;

      h3 {
        color: #666;
        font-size: 1rem;
      }
    }

    .vehicle-details-toggle {
      margin-top: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background: white;

      summary {
        cursor: pointer;
        font-weight: 600;
        color: #667eea;
        list-style: none;
        display: flex;
        align-items: center;
        gap: 8px;

        &::-webkit-details-marker {
          display: none;
        }

        &:before {
          content: '▶';
          display: inline-block;
          transition: transform 0.2s;
        }
      }

      &[open] summary:before {
        transform: rotate(90deg);
      }

      .form-group {
        margin-top: 15px;
      }
    }

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #555;
      }

      input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #667eea;
        }

        &.error {
          border-color: #f44336;
        }
      }

      .error-message {
        display: block;
        margin-top: 5px;
        color: #f44336;
        font-size: 0.9rem;
      }
    }

    .btn-activate {
      width: 100%;
      padding: 15px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .success-message {
      text-align: center;
      padding: 40px 20px;

      i {
        font-size: 5rem;
        color: #4CAF50;
        margin-bottom: 20px;
      }

      h2 {
        margin: 0 0 15px 0;
        color: #333;
      }

      p {
        margin: 10px 0;
        color: #666;
        font-size: 1.1rem;
      }

      .btn-login {
        margin-top: 30px;
        padding: 15px 40px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s;

        &:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      }
    }

    .loading-state,
    .error-state {
      text-align: center;
      background: white;
      border-radius: 16px;
      padding: 60px 40px;
      max-width: 500px;
      width: 100%;

      i {
        font-size: 4rem;
        margin-bottom: 20px;
      }

      h2 {
        margin: 0 0 15px 0;
        color: #333;
      }

      p {
        margin: 0;
        color: #666;
        font-size: 1.1rem;
      }

      .btn-secondary {
        margin-top: 20px;
        padding: 12px 30px;
        background: #757575;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #616161;
        }
      }
    }

    .loading-state i {
      color: #667eea;
    }

    .error-state i {
      color: #f44336;
    }
  `]
})
export class DriverActivationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  token = '';
  loading = true;
  error = '';
  activationInfo: ActivationInfo | null = null;
  activating = false;
  activated = false;

  activationForm: FormGroup;

  constructor() {
    this.activationForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      phone: [''],
      vehicleMake: [''],
      vehicleModel: [''],
      vehicleColor: ['']
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'];
    if (this.token) {
      this.loadActivationInfo();
    } else {
      this.error = 'Kein Aktivierungs-Token gefunden';
      this.loading = false;
    }
  }

  loadActivationInfo(): void {
    this.http.get<ActivationInfo>(`${environment.apiUrl}/drivers/activation-info/${this.token}`).subscribe({
      next: (data) => {
        this.activationInfo = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Ungültiger oder abgelaufener Link';
        this.loading = false;
      }
    });
  }

  activateAccount(): void {
    if (this.activationForm.invalid || this.passwordMismatch()) {
      return;
    }

    this.activating = true;

    const formValue = this.activationForm.value;
    const data = {
      password: formValue.password,
      phone: formValue.phone || undefined,
      vehicle_info: (formValue.vehicleMake || formValue.vehicleModel || formValue.vehicleColor) ? {
        make: formValue.vehicleMake,
        model: formValue.vehicleModel,
        color: formValue.vehicleColor
      } : undefined
    };

    this.http.post(`${environment.apiUrl}/drivers/activate/${this.token}`, data).subscribe({
      next: () => {
        this.activated = true;
        this.activating = false;
      },
      error: (err) => {
        this.activating = false;
        this.error = err.error?.error || 'Aktivierung fehlgeschlagen';
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.activationForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  passwordMismatch(): boolean {
    const password = this.activationForm.get('password')?.value;
    const confirmPassword = this.activationForm.get('confirmPassword')?.value;
    const confirmControl = this.activationForm.get('confirmPassword');
    return !!(confirmPassword && password !== confirmPassword && confirmControl?.touched);
  }

  getVehicleTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      car: 'Auto',
      motorcycle: 'Motorrad',
      bicycle: 'Fahrrad',
      scooter: 'Roller'
    };
    return labels[type] || type;
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}

