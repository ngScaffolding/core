import { inject } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { PERSISTENCE_LAYER } from '../persistence.interface';

export class BaseStateArrayService<T> {
  protected state!: T[];

  protected stateUpdated: BehaviorSubject<T[]>;
  protected activeUpdated = new BehaviorSubject<T | null>(null);
  protected loadingUpdated = new BehaviorSubject<boolean>(false);

  public stateUpdated$: Observable<T[]>;
  public loading$ = this.loadingUpdated.asObservable();
  public active$ = this.activeUpdated.asObservable();

  private activeKey = '';
  private isSaveToPreferences = false;

  private preferences = inject(PERSISTENCE_LAYER);

  constructor(
    state: T[],
    private key: string,
    private stateName: string,
    private saveToPreferences = false
  ) {
    this.stateUpdated = new BehaviorSubject<T[]>(state);
    this.stateUpdated$ = this.stateUpdated.asObservable();

    if (this.saveToPreferences) {
      this.setAllState(state, true);
      this.loadState();
    } else {
      this.setAllState(state, true);
    }
    this.isSaveToPreferences = saveToPreferences;
  }

  public getEntity(key: string): T | undefined {
    if (this.state && this.state?.length > 0) {
      const foundValue = this.state.find(
        (searchItem) => (searchItem as any)[this.key] === key
      );
      return foundValue || undefined;
    }
    return undefined;
  }

  public hasEntity(key: string): boolean {
    if (this.state && this.state?.length > 0) {
      return this.state.some(
        (searchItem) => (searchItem as any)[this.key] === key
      );
    }
    return false;
  }

  public selectEntity(key: string): Observable<void | T> {
    return this.stateUpdated$.pipe(
      map((state) => {
        const foundValue = this.state.find(
          (searchItem) => (searchItem as any)[this.key] === key
        );
        if (!foundValue) {
          return undefined;
        }
        return foundValue;
      }),
      distinctUntilChanged()
    );
  }

  public setState(state: T) {
    const existingIndex = this.findIndex((state as any)[this.key]);
    if (existingIndex > -1) {
      this.state[existingIndex] = state;
    } else {
      this.state.push(state);
    }
    this.stateUpdated.next(this.state);

    if (this.isSaveToPreferences) {
      this.saveState();
    }
  }

  public setAllState(allState: T[], bypassSave = false) {
    this.state = [] as T[];

    allState.forEach((state) => {
      this.state.push(state);
    });

      this.stateUpdated.next(this.state);

    if (!bypassSave && this.isSaveToPreferences) {
      this.saveState();
    }
  }

  public getAll() {
    return this.state;
  }

  public setActive(key: string) {
    const existing = this.findValue(key);
    if (!!existing) {
      this.activeKey = key;
      this.activeUpdated.next(existing);

      //this.updateState(existing);
      if (this.isSaveToPreferences) {
        this.saveState();
      }
    }
  }

  public updateActive(state: Partial<T>) {
    let existing = this.findValue(this.activeKey);
    if (!!existing) {
      existing = { ...existing, ...state };
      this.activeUpdated.next(existing);
      this.updateState(existing);
    }
  }

  public resetState() {
    this.setAllState([]);
  }

  public selectLoading() {
    return this.loadingUpdated.asObservable();
  }

  public remove(key: string) {
    const existing = this.findValue(key);
    if (!!existing) {
      this.state = this.state.filter((item) => (item as any)[this.key] !== key);
      this.stateUpdated.next(this.state);
      this.saveState();
    }
  }

  public updateState(newState: Partial<T>) {
    let updatedState = this.state;
    if (
      this.state.find(
        (item) =>
          (item as any)[this.key]?.toString()?.toUpperCase() ===
          (newState as Record<string, any>)[this.key]?.toString()?.toUpperCase()
      ) === undefined
    ) {
      updatedState.push(newState as T);
    } else {
      updatedState = this.state.map((item) => {
        if (
          (item as Record<string, any>)[this.key]?.toString()?.toUpperCase() ===
          (newState as Record<string, any>)[this.key]?.toString()?.toUpperCase()
        ) {
          return { ...item, ...newState };
    } else {
          return item;
    }
      });
    }

    this.state = updatedState;

    this.stateUpdated.next(this.state);
    if (this.isSaveToPreferences) {
      this.saveState();
    }
  }

  protected setLoading(loading: boolean) {
    this.loadingUpdated.next(loading);
  }

  private saveState() {
    if (this.saveToPreferences) {
      this.preferences.set({
        key: this.stateName,
        value: JSON.stringify(this.state),
      });
      this.preferences.set({
        key: this.stateName + ':active:',
        value: JSON.stringify(this.activeKey),
      });
    }
  }

  private async loadState() {
    const { value } = await this.preferences.get({ key: this.stateName });
    if (!!value && value !== 'undefined') {
      const parsedState = JSON.parse(value);
      if (parsedState) {
        this.state = JSON.parse(value);
        this.stateUpdated.next(this.state);
      }
    }
    const localActive = (await (this.preferences.get({key:this.stateName + ':active:'}))).value;
    if (!!localActive && localActive !== 'undefined') {
      const parsedActive = JSON.parse(localActive);
      if (parsedActive) {
        this.activeKey = parsedActive[this.key];
        this.activeUpdated.next(parsedActive);
      }
    }
  }

  private findValue(key: string): T {
    const foundValue = this.state.find(
      (searchItem) => (searchItem as any)[this.key] === key
    );
    if (!foundValue) {
      return undefined;
    }
    return foundValue;
  }

  private findIndex(key: string): number {
    return this.state.findIndex(
      (searchItem) => (searchItem as any)[this.key] === key
    );
  }
}
