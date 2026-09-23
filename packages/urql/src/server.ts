import { AsyncLocalStorage } from 'node:async_hooks';
import type { Client } from '@urql/core';
import {
  setSsrUrqlClientFactoryInitializer,
  setSsrUrqlClientResolver,
  type UrqlClientFactory,
} from './UrqlClient.js';

export type SsrUrqlDataExtractor<T = unknown> = () => T | Promise<T>;

export type UrqlSsrRequestContext = {
  request: Request;
  responseHeaders: Headers;
};

export type UrqlSsrResource<TData = unknown> = {
  client: Client;
  extractData?: SsrUrqlDataExtractor<TData>;
  dispose?: () => void | Promise<void>;
};

export type UrqlSsrResourceFactory = (
  context: UrqlSsrRequestContext
) => UrqlSsrResource | Promise<UrqlSsrResource>;

export type UrqlSsrConfiguration = {
  createResource: UrqlSsrResourceFactory;
};

type SsrUrqlScope = {
  resource: UrqlSsrResource | null;
};

const ssrUrqlScopeStorage = new AsyncLocalStorage<SsrUrqlScope>();
let ssrUrqlClientFactory: UrqlClientFactory | null = null;
let ssrUrqlDataExtractor: SsrUrqlDataExtractor | null = null;
let ssrUrqlResourceFactory: UrqlSsrResourceFactory | null = null;

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
  return ssrUrqlScopeStorage.getStore()?.resource?.client ?? undefined;
}

setSsrUrqlClientResolver(getScopeClient);
setSsrUrqlClientFactoryInitializer((factory) => {
  ssrUrqlClientFactory = factory;
});

/** @internal Test-only reset for the module-level application configuration. */
export function resetSsrUrqlScopeForTesting(): void {
  ssrUrqlClientFactory = null;
  ssrUrqlDataExtractor = null;
  ssrUrqlResourceFactory = null;
}

/**
 * Configures the request-scoped SSR resource created by the framework around
 * each render. The returned cleanup only removes this exact configuration.
 */
export function configureUrqlSsr(configuration: UrqlSsrConfiguration): () => void {
  if (
    !configuration ||
    typeof configuration !== 'object' ||
    typeof configuration.createResource !== 'function'
  ) {
    throw new TypeError(
      'configureUrqlSsr() expects an object with a createResource function.'
    );
  }

  const factory = configuration.createResource;
  ssrUrqlResourceFactory = factory;
  return () => {
    if (ssrUrqlResourceFactory === factory) {
      ssrUrqlResourceFactory = null;
    }
  };
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

export function runWithUrqlScope<T>(callback: () => T | Promise<T>): Promise<T>;
export function runWithUrqlScope<T>(
  context: UrqlSsrRequestContext,
  callback: () => T | Promise<T>
): Promise<T>;
/** Runs a callback with one request-local URQL resource. */
export async function runWithUrqlScope<T>(
  contextOrCallback: UrqlSsrRequestContext | (() => T | Promise<T>),
  scopedCallback?: () => T | Promise<T>
): Promise<T> {
  const context = typeof contextOrCallback === 'function'
    ? null
    : contextOrCallback;
  const callback = typeof contextOrCallback === 'function'
    ? contextOrCallback
    : scopedCallback;

  if (typeof callback !== 'function') {
    throw new TypeError(
      'runWithUrqlScope() expects a callback, optionally preceded by an SSR request context.'
    );
  }

  if (ssrUrqlResourceFactory && !context) {
    throw new Error(
      'runWithUrqlScope() requires { request, responseHeaders } when configureUrqlSsr() is active.'
    );
  }

  const resource = ssrUrqlResourceFactory
    ? await ssrUrqlResourceFactory(context as UrqlSsrRequestContext)
    : ssrUrqlClientFactory
      ? { client: await ssrUrqlClientFactory() }
      : null;

  if (ssrUrqlResourceFactory && !resource) {
    throw new TypeError('The URQL SSR resource factory must return a resource.');
  }

  if (resource && (!resource.client || typeof resource.client !== 'object')) {
    throw new TypeError('The URQL SSR resource must contain a native client.');
  }

  return ssrUrqlScopeStorage.run({ resource }, async () => {
    try {
      return await callback();
    } finally {
      await resource?.dispose?.();
    }
  });
}

/** Extracts application-defined SSR data from the active scope, if registered. */
export async function getUrqlSsrData(): Promise<unknown | undefined> {
  const scope = getActiveSsrUrqlScope();
  const extractor = scope.resource?.extractData ?? ssrUrqlDataExtractor;
  return extractor ? await extractor() : undefined;
}
