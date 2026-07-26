import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AnyVariables,
  type Client,
  type DocumentInput,
  type OperationContext,
  type OperationResult,
  gql,
} from '@urql/core';

type ExecutionContextKey = {
  __key: string;
};

const hookRuntime = vi.hoisted(() => ({
  cursor: 0,
  slots: [] as unknown[],
  cleanups: [] as Array<(() => void) | void>,
  currentExecutionContext: null as {
    get<T>(key: ExecutionContextKey): T | undefined;
    set<T>(key: ExecutionContextKey, value: T): void;
    has(key: ExecutionContextKey): boolean;
  } | null,
  nextKeyId: 0,
  reset() {
    this.cursor = 0;
    this.slots = [];
    this.cleanups = [];
    this.currentExecutionContext = null;
  },
}));

const hookHost = {};
const useQueryWithHost = useQuery as unknown as (
  host: object,
  options: UseQueryArgs<any>
) => ReturnType<typeof useQuery>;
const useMutationWithHost = useMutation as unknown as (
  host: object,
  options: UseMutationArgs<any>
) => ReturnType<typeof useMutation>;
const useSubscriptionWithHost = useSubscription as unknown as (
  host: object,
  options: UseSubscriptionArgs<any>
) => ReturnType<typeof useSubscription>;

vi.mock('@litsx/core', () => ({
  createExecutionContextKey: () =>
    Object.freeze({
      __key: `key-${hookRuntime.nextKeyId++}`,
    }) as ExecutionContextKey,
  getCurrentExecutionContext: () => hookRuntime.currentExecutionContext,
  useState<T>(_host: unknown, initialState: T | (() => T)) {
    const slotIndex = hookRuntime.cursor++;
    if (!(slotIndex in hookRuntime.slots)) {
      hookRuntime.slots[slotIndex] =
        typeof initialState === 'function'
          ? (initialState as () => T)()
          : initialState;
    }

    const setState = (value: T | ((current: T) => T)) => {
      const currentValue = hookRuntime.slots[slotIndex] as T;
      hookRuntime.slots[slotIndex] =
        typeof value === 'function'
          ? (value as (current: T) => T)(currentValue)
          : value;
    };

    return [hookRuntime.slots[slotIndex] as T, setState] as const;
  },
  useAfterUpdate(_host: unknown, callback: () => unknown) {
    hookRuntime.cleanups.push(callback() as (() => void) | void);
  },
}));

import { initializeUrqlClient, resetUrqlClient } from './UrqlClient';
import {
  executeMutation,
  executeQuery,
  executeSubscription,
  getDocumentLabel,
  type UseMutationArgs,
  type UseQueryArgs,
  type UseSubscriptionArgs,
  useMutation,
  useQuery,
  useSubscription,
} from './hooks';

type MockSource<TData, TVariables extends AnyVariables> = {
  subscribe: (
    listener: (result: OperationResult<TData, TVariables>) => void
  ) => { unsubscribe(): void };
  toPromise: () => Promise<OperationResult<TData, TVariables>>;
};

type DeferredSource<TData, TVariables extends AnyVariables> = {
  emit: (result: OperationResult<TData, TVariables>) => void;
  source: MockSource<TData, TVariables>;
  unsubscribe: ReturnType<typeof vi.fn>;
};

function createResult<TData, TVariables extends AnyVariables = AnyVariables>(
  data: TData,
  overrides: Partial<OperationResult<TData, TVariables>> = {}
): OperationResult<TData, TVariables> {
  return {
    data,
    error: undefined,
    extensions: undefined,
    hasNext: false,
    stale: false,
    operation: undefined,
    ...overrides,
  } as OperationResult<TData, TVariables>;
}

function createMockSource<TData, TVariables extends AnyVariables>(
  result: OperationResult<TData, TVariables>
): MockSource<TData, TVariables> {
  return {
    subscribe(listener) {
      listener(result);
      return {
        unsubscribe: vi.fn(),
      };
    },
    toPromise() {
      return Promise.resolve(result);
    },
  };
}

function createDeferredSource<TData, TVariables extends AnyVariables>():
  DeferredSource<TData, TVariables> {
  let listener:
    | ((result: OperationResult<TData, TVariables>) => void)
    | null = null;
  const unsubscribe = vi.fn();

  return {
    emit(result) {
      listener?.(result);
    },
    source: {
      subscribe(nextListener) {
        listener = nextListener;
        return { unsubscribe };
      },
      toPromise() {
        return Promise.reject(
          new Error('Deferred test sources do not support toPromise().')
        );
      },
    },
    unsubscribe,
  };
}

function createMockClient() {
  return {
    query: vi.fn(),
    mutation: vi.fn(),
    subscription: vi.fn(),
  } as unknown as Client & {
    query: ReturnType<typeof vi.fn>;
    mutation: ReturnType<typeof vi.fn>;
    subscription: ReturnType<typeof vi.fn>;
  };
}

describe('hooks runtime helpers', () => {
  beforeEach(() => {
    hookRuntime.reset();
    resetUrqlClient();
  });

  it('executeQuery resolves through toPromise using the provided client', async () => {
    const client = createMockClient();
    const result = createResult({ products: ['shoe'] });
    client.query.mockReturnValue(createMockSource(result));

    const response = await executeQuery(
      'ProductsQuery',
      { term: 'shoe' },
      { requestPolicy: 'cache-first' },
      client
    );

    expect(response).toBe(result);
    expect(client.query).toHaveBeenCalledWith(
      'ProductsQuery',
      { term: 'shoe' },
      { requestPolicy: 'cache-first' }
    );
  });

  it('executeMutation falls back to the initialized app client', async () => {
    const client = createMockClient();
    const result = createResult({ login: { ok: true } });
    client.mutation.mockReturnValue(createMockSource(result));
    initializeUrqlClient(client);

    const response = await executeMutation(
      'LoginMutation',
      { email: 'a@example.com' },
      { fetchOptions: { headers: { 'x-test': '1' } } }
    );

    expect(response).toBe(result);
    expect(client.mutation).toHaveBeenCalledWith(
      'LoginMutation',
      { email: 'a@example.com' },
      { fetchOptions: { headers: { 'x-test': '1' } } }
    );
  });

  it('executeSubscription forwards results and returns the subscription handle', async () => {
    const client = createMockClient();
    const result = createResult({ stock: 5 });
    const unsubscribe = vi.fn();
    client.subscription.mockReturnValue({
      subscribe(listener: (value: typeof result) => void) {
        listener(result);
        return { unsubscribe };
      },
    });

    const onResult = vi.fn();
    const handle = await executeSubscription(
      'StockSubscription',
      { id: 'sku-1' },
      onResult,
      { url: 'wss://example.test/graphql' } as Partial<OperationContext>,
      client
    );

    expect(client.subscription).toHaveBeenCalledWith(
      'StockSubscription',
      { id: 'sku-1' },
      { url: 'wss://example.test/graphql' }
    );
    expect(onResult).toHaveBeenCalledWith(result);
    handle.unsubscribe();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('useQuery auto-executes and updates the query state slot', async () => {
    const client = createMockClient();
    const result = createResult(
      { viewer: { id: '123' } },
      { stale: true }
    );
    client.query.mockReturnValue(createMockSource(result));

    const [initialState, reexecute] = useQueryWithHost(hookHost, {
      client,
      context: { fetchOptions: { headers: { authorization: 'Bearer token' } } },
      query: 'ViewerQuery',
      requestPolicy: 'cache-and-network',
      variables: { id: '123' },
    });

    expect(initialState.fetching).toBe(false);
    expect(client.query).toHaveBeenCalledWith(
      'ViewerQuery',
      { id: '123' },
      {
        fetchOptions: { headers: { authorization: 'Bearer token' } },
        requestPolicy: 'cache-and-network',
      }
    );

    const updatedState = hookRuntime.slots[1] as {
      data?: { viewer: { id: string } };
      stale: boolean;
      fetching: boolean;
    };
    expect(updatedState.fetching).toBe(false);
    expect(updatedState.data).toEqual({ viewer: { id: '123' } });
    expect(updatedState.stale).toBe(true);

    await reexecute({ requestPolicy: 'network-only' });
    expect(client.query).toHaveBeenLastCalledWith(
      'ViewerQuery',
      { id: '123' },
      {
        fetchOptions: { headers: { authorization: 'Bearer token' } },
        requestPolicy: 'network-only',
      }
    );
  });

  it('useQuery does not auto-execute while paused', () => {
    const client = createMockClient();

    useQueryWithHost(hookHost, {
      client,
      pause: true,
      query: 'PausedQuery',
    });

    expect(client.query).not.toHaveBeenCalled();
  });

  it('useQuery unsubscribes the previous active query and exposes fetching state while reexecuting', async () => {
    const client = createMockClient();
    const initialResult = createResult({ viewer: { id: 'first' } });
    const initialUnsubscribe = vi.fn();
    const deferredSource = createDeferredSource<{ viewer: { id: string } }, { id: string }>();

    client.query
      .mockReturnValueOnce({
        subscribe(listener: (value: typeof initialResult) => void) {
          listener(initialResult);
          return { unsubscribe: initialUnsubscribe };
        },
      })
      .mockReturnValueOnce(deferredSource.source);

    const [, reexecute] = useQueryWithHost(hookHost, {
      client,
      query: 'ViewerQuery',
      variables: { id: '123' },
    });

    const pendingResult = reexecute({ requestPolicy: 'network-only' });

    expect(initialUnsubscribe).toHaveBeenCalled();
    expect(hookRuntime.slots[1]).toMatchObject({
      data: { viewer: { id: 'first' } },
      fetching: true,
      stale: true,
    });

    deferredSource.emit(
      createResult(
        { viewer: { id: 'second' } },
        { stale: false }
      )
    );

    await expect(pendingResult).resolves.toMatchObject({
      data: { viewer: { id: 'second' } },
    });
    expect(hookRuntime.slots[1]).toMatchObject({
      data: { viewer: { id: 'second' } },
      fetching: false,
      stale: false,
    });
  });

  it('useQuery cleanup disposes the active subscription', () => {
    const client = createMockClient();
    const deferredSource = createDeferredSource<{ viewer: { id: string } }, { id: string }>();
    client.query.mockReturnValue(deferredSource.source);

    useQueryWithHost(hookHost, {
      client,
      query: 'ViewerQuery',
      variables: { id: '123' },
    });

    const cleanup = hookRuntime.cleanups[0];
    expect(typeof cleanup).toBe('function');

    (cleanup as () => void)();

    expect(deferredSource.unsubscribe).toHaveBeenCalled();
  });

  it('useMutation executes and stores the latest mutation result', async () => {
    const client = createMockClient();
    const result = createResult({ saveProduct: { id: 'p-1' } });
    client.mutation.mockReturnValue(createMockSource(result));

    const [initialState, execute] = useMutationWithHost(hookHost, {
      client,
      context: { fetchOptions: { headers: { 'x-base': '1' } } },
      mutation: 'SaveProduct',
    });

    expect(initialState.fetching).toBe(false);

    const response = await execute(
      { id: 'p-1' },
      { requestPolicy: 'network-only' }
    );

    expect(response).toBe(result);
    expect(client.mutation).toHaveBeenCalledWith(
      'SaveProduct',
      { id: 'p-1' },
      {
        fetchOptions: { headers: { 'x-base': '1' } },
        requestPolicy: 'network-only',
      }
    );
    expect(hookRuntime.slots[1]).toMatchObject({
      data: { saveProduct: { id: 'p-1' } },
      fetching: false,
    });
  });

  it('useSubscription auto-starts and stores pushed results', () => {
    const client = createMockClient();
    const result = createResult({ notifications: ['a'] }, { hasNext: true });
    client.subscription.mockReturnValue({
      subscribe(listener: (value: typeof result) => void) {
        listener(result);
        return {
          unsubscribe: vi.fn(),
        };
      },
    });

    useSubscriptionWithHost(hookHost, {
      client,
      context: { url: 'wss://example.test/graphql' } as Partial<OperationContext>,
      subscription: 'NotificationsSubscription',
      variables: { first: 1 },
    });

    expect(client.subscription).toHaveBeenCalledWith(
      'NotificationsSubscription',
      { first: 1 },
      { url: 'wss://example.test/graphql' }
    );
    expect(hookRuntime.slots[1]).toMatchObject({
      data: { notifications: ['a'] },
      hasNext: true,
      fetching: false,
    });
  });

  it('useSubscription does not auto-start while paused', () => {
    const client = createMockClient();

    useSubscriptionWithHost(hookHost, {
      client,
      pause: true,
      subscription: 'NotificationsSubscription',
    });

    expect(client.subscription).not.toHaveBeenCalled();
  });

  it('useSubscription unsubscribes the previous active subscription when restarted', () => {
    const client = createMockClient();
    const firstUnsubscribe = vi.fn();
    const secondUnsubscribe = vi.fn();

    client.subscription
      .mockReturnValueOnce({
        subscribe() {
          return { unsubscribe: firstUnsubscribe };
        },
      })
      .mockReturnValueOnce({
        subscribe() {
          return { unsubscribe: secondUnsubscribe };
        },
      });

    const [, start] = useSubscriptionWithHost(hookHost, {
      client,
      subscription: 'NotificationsSubscription',
      variables: { first: 1 },
    });

    start({ requestPolicy: 'network-only' });

    expect(firstUnsubscribe).toHaveBeenCalled();
    expect(client.subscription).toHaveBeenLastCalledWith(
      'NotificationsSubscription',
      { first: 1 },
      { requestPolicy: 'network-only' }
    );

    const cleanup = hookRuntime.cleanups[0];
    expect(typeof cleanup).toBe('function');
    (cleanup as () => void)();
    expect(secondUnsubscribe).toHaveBeenCalled();
  });

  it('getDocumentLabel uses operation names and falls back for anonymous documents', () => {
    const namedDocument = gql`
      query ProductsList {
        products
      }
    `;
    const anonymousDocument = gql`
      query {
        products
      }
    ` as DocumentInput<unknown, AnyVariables>;

    expect(getDocumentLabel('RawQuery')).toBe('RawQuery');
    expect(getDocumentLabel(namedDocument)).toBe('ProductsList');
    expect(getDocumentLabel(anonymousDocument)).toBe('AnonymousOperation');
  });
});
