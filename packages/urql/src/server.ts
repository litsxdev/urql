import { AsyncLocalStorage } from 'node:async_hooks';
import type { Client } from '@urql/core';
import {
  setSsrUrqlClientFactoryInitializer,
  setSsrUrqlClientResolver,
  type UrqlClientFactory,
} from './UrqlClient.js';

export type SsrUrqlDataExtractor<T = unknown> = () => T | Promise<T>;

type SsrUrqlScope = {
  client: Client | null;
};

const ssrUrqlScopeStorage = new AsyncLocalStorage<SsrUrqlScope>();
let ssrUrqlClientFactory: UrqlClientFactory | null = null;
let ssrUrqlDataExtractor: SsrUrqlDataExtractor | null = null;

function getActiveSsrUrqlScope(): SsrUrqlScope {
  const scope = ssrUrqlScopeStorage.getStore();
  if (!scope) {
    throw new Error(
      'URQL SSR client accessed outside an SSR scope. The framework runtime must wrap the render with runWithUrqlScope().'
    );
  }

  return scope;
}

function getScopeClient(): Client | undefined {
  return ssrUrqlScopeStorage.getStore()?.client ?? undefined;
}

setSsrUrqlClientResolver(getScopeClient);
setSsrUrqlClientFactoryInitializer((factory) => {
  ssrUrqlClientFactory = factory;
});

/** @internal Test-only reset for the module-level application configuration. */
export function resetSsrUrqlScopeForTesting(): void {
  ssrUrqlClientFactory = null;
  ssrUrqlDataExtractor = null;
}

/**
 * Registers optional SSR data extraction. The application controls both the
 * exchange and the serialized value; no particular URQL exchange is assumed.
 */
export function registerSsrUrqlData<T>(extractor: SsrUrqlDataExtractor<T>): () => void {
  if (typeof extractor !== 'function') {
    throw new TypeError('registerSsrUrqlData() expects a data extractor function.');
  }

  ssrUrqlDataExtractor = extractor;
  return () => {
    if (ssrUrqlDataExtractor === extractor) {
      ssrUrqlDataExtractor = null;
    }
  };
}

/** Runs a callback with a request-local, memoized native URQL Client. */
export async function runWithUrqlScope<T>(callback: () => T | Promise<T>): Promise<T> {
  if (typeof callback !== 'function') {
    throw new TypeError('runWithUrqlScope() expects a callback function.');
  }

  const client = ssrUrqlClientFactory ? await ssrUrqlClientFactory() : null;
  return ssrUrqlScopeStorage.run({ client }, callback);
}

/** Extracts application-defined SSR data from the active scope, if registered. */
export async function getUrqlSsrData(): Promise<unknown | undefined> {
  getActiveSsrUrqlScope();
  return ssrUrqlDataExtractor ? await ssrUrqlDataExtractor() : undefined;
}
