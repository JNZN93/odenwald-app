import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingStates = new Map<string, BehaviorSubject<boolean>>();
  private globalLoadingSubject = new BehaviorSubject<boolean>(false);
  private activeLoadings = new Set<string>();

  public globalLoading$: Observable<boolean> = this.globalLoadingSubject.asObservable();

  private scheduleNext(subject: BehaviorSubject<boolean>, value: boolean): void {
    // Avoid ExpressionChangedAfterItHasBeenCheckedError by emitting asynchronously
    Promise.resolve().then(() => subject.next(value));
  }

  /**
   * Startet einen Ladezustand für einen bestimmten Schlüssel
   */
  start(key: string = 'global'): void {
    if (key === 'global') {
      this.scheduleNext(this.globalLoadingSubject, true);
    } else {
      if (!this.loadingStates.has(key)) {
        this.loadingStates.set(key, new BehaviorSubject<boolean>(false));
      }
      this.scheduleNext(this.loadingStates.get(key)!, true);
      this.activeLoadings.add(key);
      this.updateGlobalLoading();
    }
  }

  /**
   * Stoppt einen Ladezustand für einen bestimmten Schlüssel
   */
  stop(key: string = 'global'): void {
    if (key === 'global') {
      this.scheduleNext(this.globalLoadingSubject, false);
    } else {
      if (this.loadingStates.has(key)) {
        this.scheduleNext(this.loadingStates.get(key)!, false);
        this.activeLoadings.delete(key);
        this.updateGlobalLoading();
      }
    }
  }

  /**
   * Gibt den Ladezustand für einen bestimmten Schlüssel zurück
   */
  isLoading(key: string = 'global'): Observable<boolean> {
    if (key === 'global') {
      return this.globalLoading$;
    }

    if (!this.loadingStates.has(key)) {
      this.loadingStates.set(key, new BehaviorSubject<boolean>(false));
    }

    return this.loadingStates.get(key)!.asObservable();
  }

  /**
   * Gibt den aktuellen Ladezustand für einen bestimmten Schlüssel zurück
   */
  isLoadingSync(key: string = 'global'): boolean {
    if (key === 'global') {
      return this.globalLoadingSubject.value;
    }

    if (this.loadingStates.has(key)) {
      return this.loadingStates.get(key)!.value;
    }

    return false;
  }

  /**
   * Stoppt alle Ladezustände
   */
  stopAll(): void {
    this.scheduleNext(this.globalLoadingSubject, false);

    this.activeLoadings.forEach(key => {
      if (this.loadingStates.has(key)) {
        this.scheduleNext(this.loadingStates.get(key)!, false);
      }
    });

    this.activeLoadings.clear();
  }

  /**
   * Erstellt einen Observable, der automatisch start/stop managed
   */
  withLoading<T>(key: string = 'global'): (source: Observable<T>) => Observable<T> {
    return (source: Observable<T>) => {
      return new Observable<T>(subscriber => {
        this.start(key);

        const subscription = source.subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => {
            this.stop(key);
            subscriber.error(error);
          },
          complete: () => {
            this.stop(key);
            subscriber.complete();
          }
        });

        return () => {
          subscription.unsubscribe();
          this.stop(key);
        };
      });
    };
  }

  private updateGlobalLoading(): void {
    const hasActiveLoadings = this.activeLoadings.size > 0;
    this.scheduleNext(this.globalLoadingSubject, hasActiveLoadings);
  }
}
