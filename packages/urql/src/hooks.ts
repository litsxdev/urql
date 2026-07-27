import { useAfterUpdate, useState } from '@litsx/core';
import {
  type AnyVariables,
  type Client,
  type CombinedError,
  type DocumentInput,
  type Operation,
  type OperationContext,
  type OperationResult,
  type RequestPolicy,
  getOperationName,
} from '@urql/core';
import { getUrqlClient } from './UrqlClient.js';

type Unsubscribe = () => void;
type HookHost = object | undefined;

export interface UseQueryState<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> {
  data?: TData;
  error?: CombinedError;
  extensions?: Record<string, any>;
  fetching: boolean;
  hasNext: boolean;
  operation?: Operation<TData, TVariables>;
  stale: boolean;
}

export type UseMutationState<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> = UseQueryState<TData, TVariables>;

export type UseSubscriptionState<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> = UseQueryState<TData, TVariables>;

export interface UseQueryArgs<TVariables extends AnyVariables = AnyVariables> {
  client?: Client;
  context?: Partial<OperationContext>;
  pause?: boolean;
  query: DocumentInput<any, TVariables>;
  requestPolicy?: RequestPolicy;
  variables?: TVariables;
}

export interface UseMutationArgs<TVariables extends AnyVariables = AnyVariables> {
  client?: Client;
  context?: Partial<OperationContext>;
  mutation: DocumentInput<any, TVariables>;
}

export interface UseSubscriptionArgs<
  TVariables extends AnyVariables = AnyVariables,
> {
  client?: Client;
  context?: Partial<OperationContext>;
  pause?: boolean;
  subscription: DocumentInput<any, TVariables>;
  variables?: TVariables;
}

export type UseQueryExecute<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> = (
  context?: Partial<OperationContext>
) => Promise<OperationResult<TData, TVariables>>;

export type UseMutationExecute<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> = (
  variables: TVariables,
  context?: Partial<OperationContext>
) => Promise<OperationResult<TData, TVariables>>;

export type UseSubscriptionExecute = (
  context?: Partial<OperationContext>
) => void;

export type UseQueryResponse<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> = [UseQueryState<TData, TVariables>, UseQueryExecute<TData, TVariables>];

export type UseMutationResponse<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> = [UseMutationState<TData, TVariables>, UseMutationExecute<TData, TVariables>];

export type UseSubscriptionResponse<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> = [UseSubscriptionState<TData, TVariables>, UseSubscriptionExecute];

type Listener<TData, TVariables extends AnyVariables> = (
  state: UseQueryState<TData, TVariables>
) => void;

function getClient(client?: Client): Client {
  return client ?? getUrqlClient();
}

function getVariables<TVariables extends AnyVariables>(
  variables?: TVariables
): TVariables {
  return variables ?? ({} as TVariables);
}

function getDependencyKey(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

function toState<TData, TVariables extends AnyVariables>(
  result: OperationResult<TData, TVariables>
): UseQueryState<TData, TVariables> {
  return {
    data: result.data,
    error: result.error,
    extensions: result.extensions,
    fetching: false,
    hasNext: !!result.hasNext,
    operation: result.operation,
    stale: !!result.stale,
  };
}

class QueryObserver<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> {
  private readonly client: Client;
  private readonly query: DocumentInput<TData, TVariables>;
  private readonly listeners = new Set<Listener<TData, TVariables>>();

  private context?: Partial<OperationContext>;
  private pause = false;
  private requestPolicy?: RequestPolicy;
  private subscription?: { unsubscribe(): void };
  private variables?: TVariables;

  private state: UseQueryState<TData, TVariables> = {
    fetching: false,
    hasNext: false,
    stale: false,
  };

  constructor(options: UseQueryArgs<TVariables>) {
    this.client = getClient(options.client);
    this.query = options.query as DocumentInput<TData, TVariables>;
    this.update(options);
  }

  update(options: UseQueryArgs<TVariables>): void {
    this.context = options.context;
    this.pause = !!options.pause;
    this.requestPolicy = options.requestPolicy;
    this.variables = options.variables;
  }

  getSnapshot(): UseQueryState<TData, TVariables> {
    return this.state;
  }

  isPaused(): boolean {
    return this.pause;
  }

  subscribe(listener: Listener<TData, TVariables>): Unsubscribe {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async reexecute(
    context?: Partial<OperationContext>
  ): Promise<OperationResult<TData, TVariables>> {
    const nextContext = {
      ...this.context,
      ...context,
      requestPolicy: context?.requestPolicy ?? this.requestPolicy,
    };

    this.subscription?.unsubscribe();
    this.patchState({
      fetching: true,
      stale: !!this.state.data,
    });

    const source = this.client.query<TData, TVariables>(
      this.query,
      getVariables(this.variables),
      nextContext
    );

    return new Promise((resolve) => {
      let settled = false;
      this.subscription = source.subscribe((result) => {
        this.state = toState(result);
        this.notify();
        if (!settled) {
          settled = true;
          resolve(result);
        }
      });
    });
  }

  dispose(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.listeners.clear();
  }

  private patchState(
    patch: Partial<UseQueryState<TData, TVariables>>
  ): void {
    this.state = {
      ...this.state,
      ...patch,
    };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

class MutationObserver<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> {
  private readonly client: Client;
  private readonly mutation: DocumentInput<TData, TVariables>;
  private readonly listeners = new Set<Listener<TData, TVariables>>();

  private context?: Partial<OperationContext>;
  private state: UseMutationState<TData, TVariables> = {
    fetching: false,
    hasNext: false,
    stale: false,
  };

  constructor(options: UseMutationArgs<TVariables>) {
    this.client = getClient(options.client);
    this.context = options.context;
    this.mutation = options.mutation as DocumentInput<TData, TVariables>;
  }

  update(options: UseMutationArgs<TVariables>): void {
    this.context = options.context;
  }

  getSnapshot(): UseMutationState<TData, TVariables> {
    return this.state;
  }

  subscribe(listener: Listener<TData, TVariables>): Unsubscribe {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async execute(
    variables: TVariables,
    context?: Partial<OperationContext>
  ): Promise<OperationResult<TData, TVariables>> {
    this.patchState({
      error: undefined,
      fetching: true,
      stale: !!this.state.data,
    });

    const result = await this.client
      .mutation<TData, TVariables>(this.mutation, variables, {
        ...this.context,
        ...context,
      })
      .toPromise();

    this.state = toState(result);
    this.notify();
    return result;
  }

  dispose(): void {
    this.listeners.clear();
  }

  private patchState(
    patch: Partial<UseMutationState<TData, TVariables>>
  ): void {
    this.state = {
      ...this.state,
      ...patch,
    };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

class SubscriptionObserver<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
> {
  private readonly client: Client;
  private readonly listeners = new Set<Listener<TData, TVariables>>();
  private readonly subscriptionDocument: DocumentInput<TData, TVariables>;

  private activeSubscription?: { unsubscribe(): void };
  private context?: Partial<OperationContext>;
  private pause = false;
  private state: UseSubscriptionState<TData, TVariables> = {
    fetching: false,
    hasNext: false,
    stale: false,
  };
  private variables?: TVariables;

  constructor(options: UseSubscriptionArgs<TVariables>) {
    this.client = getClient(options.client);
    this.subscriptionDocument =
      options.subscription as DocumentInput<TData, TVariables>;
    this.update(options);
  }

  update(options: UseSubscriptionArgs<TVariables>): void {
    this.context = options.context;
    this.pause = !!options.pause;
    this.variables = options.variables;
  }

  getSnapshot(): UseSubscriptionState<TData, TVariables> {
    return this.state;
  }

  isPaused(): boolean {
    return this.pause;
  }

  subscribe(listener: Listener<TData, TVariables>): Unsubscribe {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(context?: Partial<OperationContext>): void {
    this.activeSubscription?.unsubscribe();
    this.patchState({
      fetching: true,
      stale: !!this.state.data,
    });

    this.activeSubscription = this.client
      .subscription<TData, TVariables>(
        this.subscriptionDocument,
        getVariables(this.variables),
        {
          ...this.context,
          ...context,
        }
      )
      .subscribe((result) => {
        this.state = toState(result);
        this.notify();
      });
  }

  dispose(): void {
    this.activeSubscription?.unsubscribe();
    this.activeSubscription = undefined;
    this.listeners.clear();
  }

  private patchState(
    patch: Partial<UseSubscriptionState<TData, TVariables>>
  ): void {
    this.state = {
      ...this.state,
      ...patch,
    };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export function useQuery<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  options: UseQueryArgs<TVariables>
): UseQueryResponse<TData, TVariables>;
export function useQuery<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  hostOrOptions: HookHost | UseQueryArgs<TVariables>,
  providedOptions?: UseQueryArgs<TVariables>
): UseQueryResponse<TData, TVariables> {
  const host = providedOptions ? (hostOrOptions as HookHost) : undefined;
  const options = (providedOptions ?? hostOrOptions) as UseQueryArgs<TVariables>;
  const [observer] = useState(
    host,
    () => new QueryObserver<TData, TVariables>(options)
  );
  const [state, setState] = useState(host, observer.getSnapshot());

  observer.update(options);

  const contextKey = getDependencyKey(options.context);
  const variablesKey = getDependencyKey(options.variables);

  useAfterUpdate(host, () => {
    const unsubscribe = observer.subscribe(setState);
    if (!observer.isPaused()) {
      void observer.reexecute();
    }

    return () => {
      unsubscribe();
      observer.dispose();
    };
  }, [options.pause, options.requestPolicy, contextKey, variablesKey]);

  return [state, (context) => observer.reexecute(context)];
}

export function useMutation<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  options: UseMutationArgs<TVariables>
): UseMutationResponse<TData, TVariables>;
export function useMutation<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  hostOrOptions: HookHost | UseMutationArgs<TVariables>,
  providedOptions?: UseMutationArgs<TVariables>
): UseMutationResponse<TData, TVariables> {
  const host = providedOptions ? (hostOrOptions as HookHost) : undefined;
  const options = (providedOptions ?? hostOrOptions) as UseMutationArgs<TVariables>;
  const [observer] = useState(
    host,
    () => new MutationObserver<TData, TVariables>(options)
  );
  const [state, setState] = useState(host, observer.getSnapshot());

  observer.update(options);

  const contextKey = getDependencyKey(options.context);

  useAfterUpdate(host, () => {
    const unsubscribe = observer.subscribe(setState);
    return () => {
      unsubscribe();
      observer.dispose();
    };
  }, [contextKey]);

  return [state, (variables, context) => observer.execute(variables, context)];
}

export function useSubscription<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  options: UseSubscriptionArgs<TVariables>
): UseSubscriptionResponse<TData, TVariables>;
export function useSubscription<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  hostOrOptions: HookHost | UseSubscriptionArgs<TVariables>,
  providedOptions?: UseSubscriptionArgs<TVariables>
): UseSubscriptionResponse<TData, TVariables> {
  const host = providedOptions ? (hostOrOptions as HookHost) : undefined;
  const options = (providedOptions ?? hostOrOptions) as UseSubscriptionArgs<TVariables>;
  const [observer] = useState(
    host,
    () => new SubscriptionObserver<TData, TVariables>(options)
  );
  const [state, setState] = useState(host, observer.getSnapshot());

  observer.update(options);

  const contextKey = getDependencyKey(options.context);
  const variablesKey = getDependencyKey(options.variables);

  useAfterUpdate(host, () => {
    const unsubscribe = observer.subscribe(setState);
    if (!observer.isPaused()) {
      observer.start();
    }

    return () => {
      unsubscribe();
      observer.dispose();
    };
  }, [options.pause, contextKey, variablesKey]);

  return [state, (context) => observer.start(context)];
}

export async function executeQuery<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  query: DocumentInput<TData, TVariables>,
  variables: TVariables,
  context?: Partial<OperationContext>,
  client?: Client
): Promise<OperationResult<TData, TVariables>> {
  return getClient(client)
    .query<TData, TVariables>(query, variables, context)
    .toPromise();
}

export async function executeMutation<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  mutation: DocumentInput<TData, TVariables>,
  variables: TVariables,
  context?: Partial<OperationContext>,
  client?: Client
): Promise<OperationResult<TData, TVariables>> {
  return getClient(client)
    .mutation<TData, TVariables>(mutation, variables, context)
    .toPromise();
}

export async function executeSubscription<
  TData = unknown,
  TVariables extends AnyVariables = AnyVariables,
>(
  subscription: DocumentInput<TData, TVariables>,
  variables: TVariables,
  onResult: (result: OperationResult<TData, TVariables>) => void,
  context?: Partial<OperationContext>,
  client?: Client
): Promise<{ unsubscribe(): void }> {
  return getClient(client)
    .subscription<TData, TVariables>(subscription, variables, context)
    .subscribe(onResult);
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export function getDocumentLabel<TData, TVariables extends AnyVariables>(
  document: DocumentInput<TData, TVariables>
): string {
  if (typeof document === 'string') {
    return document;
  }

  return getOperationName(document) ?? 'AnonymousOperation';
}
