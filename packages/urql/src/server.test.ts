import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Client } from '@urql/core';
import type { ExecutionContextKey, LitsxExecutionContext } from '@litsx/core';

const executionState = vi.hoisted(() => ({
  currentContext: null as LitsxExecutionContext | null,
  nextKeyId: 0,
}));

vi.mock('@litsx/core', () => ({
  createExecutionContextKey: <T>() =>
    Object.freeze({ __key: `key-${executionState.nextKeyId++}` }) as ExecutionContextKey<T>,
  getCurrentExecutionContext: () => executionState.currentContext,
}));
import {
  getUrqlSsrData,
  registerSsrUrqlData,
  resetSsrUrqlScopeForTesting,
  runWithUrqlScope,
} from './server.js';
import {
  getExecutionUrqlClient,
  getUrqlClient,
  initializeUrqlClient,
} from './UrqlClient.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  executionState.currentContext = null;
  resetSsrUrqlScopeForTesting();
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

function createExecutionContext(): LitsxExecutionContext {
  const values = new Map<unknown, unknown>();
  return {
    get<T>(key: ExecutionContextKey<T>): T | undefined {
      return values.get(key) as T | undefined;
    },
    set<T>(key: ExecutionContextKey<T>, value: T): void {
      values.set(key, value);
    },
    has<T>(key: ExecutionContextKey<T>): boolean {
      return values.has(key);
    },
  };
}

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

function initializeClient(factory: () => Client | Promise<Client>): void {
  initializeUrqlClient(factory);
}

describe('URQL SSR scopes', () => {
  it('memoizes one native client for layout, page, and LitSX-facing resolution', async () => {
    const client = createClient('render');
    const factory = vi.fn(() => client);
    initializeClient(factory);

    const executionContext = createExecutionContext();
    const resolved = await runWithUrqlScope(async () => {
      const layoutClient = getUrqlClient();
      const pageClient = getUrqlClient();
      executionState.currentContext = executionContext;
      const componentClient = getUrqlClient();
      return { layoutClient, pageClient, componentClient };
    });

    expect(factory).toHaveBeenCalledTimes(1);
    expect(resolved.layoutClient).toBe(client);
    expect(resolved.pageClient).toBe(client);
    expect(resolved.componentClient).toBe(client);
    expect(getExecutionUrqlClient(executionContext)).toBe(client);
  });

  it('isolates concurrent render scopes, including asynchronous factories', async () => {
    let sequence = 0;
    initializeClient(async () => createClient(`render-${++sequence}`));

    const [first, second] = await Promise.all([
      runWithUrqlScope(async () => {
        await Promise.resolve();
        return getUrqlClient();
      }),
      runWithUrqlScope(async () => {
        await Promise.resolve();
        return getUrqlClient();
      }),
    ]);

    expect(first).not.toBe(second);
    expect(first.toJSON()).toEqual({ label: 'render-1' });
    expect(second.toJSON()).toEqual({ label: 'render-2' });
  });

  it('does not retain a request client after its scope closes', async () => {
    initializeClient(() => createClient('render'));

    await runWithUrqlScope(() => getUrqlClient());

    expect(() => getUrqlClient()).toThrow(/URQL client not resolved/);
  });

  it('reports an explicit error when a scope has no registered factory', async () => {
    await expect(
      runWithUrqlScope(() => getUrqlClient())
    ).rejects.toThrow(/URQL client not resolved/);
  });

  it('accepts an untouched native client with arbitrary exchanges', async () => {
    const client = createClient('custom-exchanges');
    initializeClient(() => client);

    await runWithUrqlScope(() => {
      expect(getUrqlClient()).toBe(client);
      expect(getUrqlClient().query).toBe(client.query);
      expect(getUrqlClient().subscription).toBe(client.subscription);
    });
  });

  it('extracts optional application-defined SSR data without requiring an SSR exchange', async () => {
    initializeClient(() => createClient('without-ssr-exchange'));
    cleanups.push(registerSsrUrqlData(() => ({ operationCache: { product: '1' } })));

    await runWithUrqlScope(async () => {
      await expect(getUrqlSsrData()).resolves.toEqual({
        operationCache: { product: '1' },
      });
    });
  });

  it('returns undefined for data when no extractor is registered', async () => {
    initializeClient(() => createClient('no-data'));

    await runWithUrqlScope(async () => {
      await expect(getUrqlSsrData()).resolves.toBeUndefined();
    });
  });
});
