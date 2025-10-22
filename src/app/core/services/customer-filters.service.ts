import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CustomerFiltersState {
  searchTerm: string;
  category: string | null;
  openNow: boolean;
  freeDelivery: boolean;
  minOrder: 'all' | '10' | '15';
  ratingMin: 0 | 3 | 4 | 4.5;
}

const STORAGE_KEY = 'customer_filters_v1';

@Injectable({ providedIn: 'root' })
export class CustomerFiltersService {
  private readonly defaultState: CustomerFiltersState = {
    searchTerm: '',
    category: null,
    openNow: false,
    freeDelivery: false,
    minOrder: 'all',
    ratingMin: 0
  };

  private stateSubject = new BehaviorSubject<CustomerFiltersState>(
    this.loadFromStorage()
  );

  readonly state$ = this.stateSubject.asObservable();

  getState(): CustomerFiltersState {
    return this.stateSubject.getValue();
  }

  update(partial: Partial<CustomerFiltersState>): void {
    const merged = { ...this.getState(), ...partial } as CustomerFiltersState;
    this.stateSubject.next(merged);
    this.saveToStorage(merged);
  }

  setCategory(category: string | null): void {
    this.update({ category, searchTerm: category || this.getState().searchTerm });
  }

  clear(): void {
    this.stateSubject.next({ ...this.defaultState });
    this.saveToStorage(this.defaultState);
  }

  private loadFromStorage(): CustomerFiltersState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...this.defaultState };
      const parsed = JSON.parse(raw);
      // Always ensure searchTerm is empty when loading from storage
      return { ...this.defaultState, ...parsed, searchTerm: '' } as CustomerFiltersState;
    } catch {
      return { ...this.defaultState };
    }
  }

  private saveToStorage(state: CustomerFiltersState): void {
    try {
      // Don't save searchTerm to localStorage - it should be cleared on refresh
      const stateToSave = { ...state, searchTerm: '' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }
}


