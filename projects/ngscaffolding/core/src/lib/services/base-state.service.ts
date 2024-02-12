import { BehaviorSubject } from "rxjs";

export class BaseStateService<T> {

  private state: T;
  private stateUpdated = new BehaviorSubject<T>(null);
  constructor(state: T) {
        this.state = state;
    }
    public stateUpdated$ = this.stateUpdated.asObservable();

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

    private loadState() {
      localStorage.getItem('state' + this.constructor.name);

}
