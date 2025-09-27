import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PollingControlService {
  private pollingEnabled = new BehaviorSubject<boolean>(true);
  
  // Observable to track polling state
  pollingEnabled$ = this.pollingEnabled.asObservable();
  
  // Enable/disable all polling across the app
  setPollingEnabled(enabled: boolean) {
    this.pollingEnabled.next(enabled);
    console.log(`🔄 Polling ${enabled ? 'enabled' : 'disabled'} globally`);
  }
  
  // Check if polling is currently enabled
  isPollingEnabled(): boolean {
    return this.pollingEnabled.value;
  }
  
  // Disable polling temporarily (useful for debugging)
  disablePolling() {
    this.setPollingEnabled(false);
  }
  
  // Re-enable polling
  enablePolling() {
    this.setPollingEnabled(true);
  }
}
