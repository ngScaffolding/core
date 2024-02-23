import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

export class BaseStateService<T> {
  protected state: T;
  protected stateUpdated = new BehaviorSubject<T>(null);
  protected loadingUpdated = new BehaviorSubject<boolean>(false);
  protected stateElementUpdated = new BehaviorSubject<[string, any]>([
    null,
    null,
  ]);

  public stateUpdated$ = this.stateUpdated.asObservable();
  public loading$ = this.stateUpdated.asObservable();
  public stateElementUpdated$ = this.stateElementUpdated.asObservable();

  constructor(state: T, private saveToLocalStorage = false) {
    if (this.saveToLocalStorage) {
      this.loadState();
    } else {
      this.setState(state);
    }
  }

  public getState(): T {
    return this.state;
  }

  public setState(state: T) {
    this.notifyChanges(state, this.state);
    this.state = state;
    this.stateUpdated.next(this.state);
  }

  public select(key: string): Observable<any> {
    return this.stateUpdated$.pipe(
      map((state) => {
        return state[key];
      }),
      distinctUntilChanged()
    );
  }

  public resetState() {
    this.state = {} as T;
  }

  public updateState(state: Partial<T>) {
    this.notifyChanges(state, this.state);
    this.state = { ...this.state, ...state };
  }

  protected setLoading(loading: boolean) {
    this.loadingUpdated.next(loading);
  }

  private loadState() {
    const local = localStorage.getItem('state' + this.constructor.name);
    if (local) {
      this.setState(JSON.parse(local));
    }
  }

  private notifyChanges(newState: Partial<T>, oldState: T) {
    Object.keys(newState).forEach((key) => {
      if (newState[key] !== oldState[key]) {
        this.stateElementUpdated.next([key, newState[key]]);
      }
    });

    // Save to local storage
    if (this.saveToLocalStorage) {
      localStorage.setItem(
        'state' + this.constructor.name,
        JSON.stringify(this.state)
      );
    }
  }
}
