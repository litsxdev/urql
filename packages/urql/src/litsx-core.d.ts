declare module '@litsx/core' {
  export interface ExecutionContextKey<T> {
    readonly __brand?: T;
  }

  export interface LitsxExecutionContext {
    get<T>(key: ExecutionContextKey<T>): T | undefined;
    set<T>(key: ExecutionContextKey<T>, value: T): void;
    has<T>(key: ExecutionContextKey<T>): boolean;
  }

  export function createExecutionContextKey<T>(
    description?: string
  ): ExecutionContextKey<T>;

  export function getCurrentExecutionContext():
    | LitsxExecutionContext
    | null;

  export function useState<T>(
    initialState: T | (() => T)
  ): [T, (value: T) => void];

  export function useAfterUpdate(
    callback: () => unknown,
    dependencies: readonly unknown[]
  ): void;
}
