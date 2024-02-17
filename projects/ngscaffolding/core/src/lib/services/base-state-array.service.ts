import { BehaviorSubject } from 'rxjs';

export class BaseStateArrayService<T> {
  protected state: T[];
  protected stateUpdated = new BehaviorSubject<T[]>(null);
  protected loadingUpdated = new BehaviorSubject<boolean>(false);

  public stateUpdated$ = this.stateUpdated.asObservable();
  public loading$ = this.stateUpdated.asObservable();

  constructor(state: T[], private key: string) {
    this.state = state;
  }

  public getEntity(key: string): T {
    if (this.state?.length > 0) {
      return this.state.find((searchItem) => searchItem[this.key] === key);
    }
    return null;
  }

  public setState(state: T) {
    let existing = this.findValue(state[this.key]);
    if(!!existing){
      existing = state;
    }
    else{
      this.state.push(state);
    }
    this.stateUpdated.next(this.state);
  }

  public resetState() {
    this.state = [] as T[];
  }

  public remove(key: string) {
    const existing = this.findValue(key);
    if(!!existing){
      this.state = this.state.filter((item) => item[this.key] !== key);
      this.stateUpdated.next(this.state);
    }
  }

  public updateState(state: Partial<T>) {
    let existing = this.findValue(state[this.key]);
    if(!!existing){
      existing = { ...existing, ...state };
    }
    else{
      this.state.push(state as T);
    }
    this.stateUpdated.next(this.state);
  }

  protected setLoading(loading: boolean) {
    this.loadingUpdated.next(loading);
  }

  private loadState() {
    localStorage.getItem('state' + this.constructor.name);
  }

  private findValue(key: string): T {
    return this.state.find((searchItem) => searchItem[this.key] === key);
  }
}
