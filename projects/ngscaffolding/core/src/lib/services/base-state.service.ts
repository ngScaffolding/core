import { BehaviorSubject } from 'rxjs';

export class BaseStateService<T> {

  protected state: T;
  protected stateUpdated = new BehaviorSubject<T>(null);
  protected loadingUpdated = new BehaviorSubject<boolean>(false);

  public stateUpdated$ = this.stateUpdated.asObservable();
  public loading$ = this.stateUpdated.asObservable();

  constructor(state: T) {
    this.state = state;
  }

  public getState(): T {
    return this.state;
  }

  public setState(state: T) {
    this.state = state;
    this.stateUpdated.next(this.state);
  }

  public resetState() {
    this.state = {} as T;
  }

  public updateState(state: Partial<T>) {
    this.state = { ...this.state, ...state };
  }

  protected setLoading(loading: boolean) {
    this.loadingUpdated.next(loading);
  }

  private loadState() {
    localStorage.getItem('state' + this.constructor.name);
  }

}
