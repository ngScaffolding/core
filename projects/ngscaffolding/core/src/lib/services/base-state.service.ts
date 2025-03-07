import { inject, Inject } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { PERSISTENCE_LAYER } from '../persistence.interface';

export class BaseStateService<T extends object> {
    protected state: T | undefined;
    protected stateUpdated: BehaviorSubject<T>;
    protected loadingUpdated = new BehaviorSubject<boolean>(true);
    protected stateElementUpdated = new BehaviorSubject<[string, any]>(['', null]);

    public stateUpdated$: Observable<T>;
    public loading$ = this.loadingUpdated.asObservable();
  public stateElementUpdated$ = this.stateElementUpdated.asObservable();

    private isSaveToPreferences = false;

    private preferences = inject(PERSISTENCE_LAYER);

    constructor(state: T, private saveToPreferences = false) {
        this.stateUpdated = new BehaviorSubject<T>(state);
        this.stateUpdated$ = this.stateUpdated.asObservable();

        if (this.saveToPreferences) {
            this.setState(state);
      this.loadState();
    } else {
      this.setState(state);
    }

        this.isSaveToPreferences = saveToPreferences;
  }

    public getState(): T {
	    if (this.state === undefined) {
	      throw new Error('State is undefined');
	    }
        return this.state;
    }

  public setState(state: T) {
        //this.notifyChanges(state, this.state);
        this.state = { ...state }; // New object reference
    this.stateUpdated.next(this.state);

        if (this.isSaveToPreferences) {
            this.saveState();
        }
  }

    public selectByName(key: string): Observable<any> {
    return this.stateUpdated$.pipe(
      	map((state) => {
                if (state.hasOwnProperty(key)) {
                    return (state as any)[key];
                } else {
                    return null;
                }
            })
    );
  }

    public hasEntity(key: string): boolean {
        return !!(this.state as any)[key];
    }

    public getEntity(key: string): any {
        return (this.state as any)[key];
    }

    public select<R>(project: (store: T) => R): Observable<R> {
    return this.stateUpdated$.pipe(map((snapshot) => project(snapshot)));
    }

  public resetState() {
    this.state = {} as T;
        if (this.isSaveToPreferences) {
            this.saveState();
        }
  }

  public updateState(state: Partial<T>) {
        if (this.state !== undefined) {
    this.notifyChanges(state, this.state);
        }
        this.state = { ...this.state, ...state } as T;
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
                key: 'state:' + this.constructor.name,
                value: JSON.stringify(this.state)
            });
        }
    }

    private async loadState() {
        const { value } = await this.preferences.get({
            key: 'state' + this.constructor.name
        });
        if (value) {
            this.setState(JSON.parse(value));
    }
  }

  private notifyChanges(newState: Partial<T>, oldState: T) {
        Object.keys(newState).forEach(key => {
            if ((newState as any)[key] !== (oldState as any)[key]) {
                this.stateElementUpdated.next([key, (newState as any)[key]]);
      }
    });

    // Save to local storage
    if (this.saveToPreferences) {
      localStorage.setItem(
        'state' + this.constructor.name,
        JSON.stringify(this.state)
      );
    }
  }
}
