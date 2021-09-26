export interface Command<T> {
  tid: String;
  body: T;
}