import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheExchange, fetchExchange, type Client } from '@urql/core';
import type {
  ExecutionContextKey,
  LitsxExecutionContext,
} from '@litsx/core';

const executionState = vi.hoisted(() => ({
  currentContext: null as LitsxExecutionContext | null,
  nextKeyId: 0,
}));

vi.mock('@litsx/core', () => ({
  createExecutionContextKey: <T>() =>
    Object.freeze({
      __key: `key-${executionState.nextKeyId++}`,
    }) as ExecutionContextKey<T>,
  getCurrentExecutionContext: () => executionState.currentContext,
}));

import {
  getExecutionUrqlClient,
  getUrqlClient,
  initializeUrqlClient,
  resetUrqlClient,
  setUrqlClient,
  setUrqlClientResolver,
} from './UrqlClient';

function createClient(label: string): Client {
  return {
    query: vi.fn(),
    mutation: vi.fn(),
    subscription: vi.fn(),
    readQuery: vi.fn(),
    executeQuery: vi.fn(),
    executeSubscription: vi.fn(),
    reexecuteOperation: vi.fn(),
    createRequestOperation: vi.fn(),
    toJSON: () => ({ label }),
  } as unknown as Client;
}

function createExecutionContext(): LitsxExecutionContext {
  const store = new Map<unknown, unknown>();
  return {
    get<T>(key: ExecutionContextKey<T>): T | undefined {
      return store.get(key) as T | undefined;
    },
    set<T>(key: ExecutionContextKey<T>, value: T): void {
      store.set(key, value);
    },
    has<T>(key: ExecutionContextKey<T>): boolean {
      return store.has(key);
    },
  };
}

describe('UrqlClient runtime resolution', () => {
  beforeEach(() => {
    executionState.currentContext = null;
    resetUrqlClient();
  });

  it('returns the app client after initialization', () => {
    const client = createClient('app');

    initializeUrqlClient(client);

    expect(getUrqlClient()).toBe(client);
  });

  it('keeps the first initialized app client', () => {
    const firstClient = createClient('first');
    const secondClient = createClient('second');

    expect(initializeUrqlClient(firstClient)).toBe(firstClient);
    expect(initializeUrqlClient(secondClient)).toBe(firstClient);
    expect(getUrqlClient()).toBe(firstClient);
  });

  it('creates an app client from urql client options', () => {
    const client = initializeUrqlClient({
      exchanges: [cacheExchange, fetchExchange],
      url: 'https://example.test/graphql',
    });

    expect(client).toBeTruthy();
    expect(getUrqlClient()).toBe(client);
  });

  it('registers and resolves a request client from the execution context', () => {
    const context = createExecutionContext();
    const requestClient = createClient('request');
    executionState.currentContext = context;

    setUrqlClient(context, requestClient);

    expect(getExecutionUrqlClient(context)).toBe(requestClient);
    expect(getUrqlClient()).toBe(requestClient);
  });

  it('prefers the execution-context client over resolver and app fallback', () => {
    const context = createExecutionContext();
    const requestClient = createClient('request');
    const resolvedClient = createClient('resolver');
    const appClient = createClient('app');

    executionState.currentContext = context;
    setUrqlClient(context, requestClient);
    setUrqlClientResolver(() => resolvedClient);
    initializeUrqlClient(appClient);

    expect(getUrqlClient()).toBe(requestClient);
  });

  it('uses the explicit resolver when no execution-context client exists', () => {
    const resolvedClient = createClient('resolver');
    const appClient = createClient('app');

    setUrqlClientResolver(() => resolvedClient);
    initializeUrqlClient(appClient);

    expect(getUrqlClient()).toBe(resolvedClient);
  });

  it('throws when no client can be resolved', () => {
    expect(() => getUrqlClient()).toThrow(
      /URQL client not resolved/
    );
  });

  it('clears the resolver, app client, and request fallback on reset', () => {
    const context = createExecutionContext();
    const requestClient = createClient('request');

    executionState.currentContext = context;
    setUrqlClient(context, requestClient);
    setUrqlClientResolver(() => createClient('resolver'));
    initializeUrqlClient(createClient('app'));

    resetUrqlClient();
    executionState.currentContext = null;

    expect(() => getUrqlClient()).toThrow(/URQL client not resolved/);
  });
});
