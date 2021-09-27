export interface Command<T> {
  tid: string;
  body: T;
}