import {
  createExecutionContextKey,
  getCurrentExecutionContext,
  type ExecutionContextKey,
  type LitsxExecutionContext,
} from '@litsx/core';
import { type Client, type ClientOptions, createClient } from '@urql/core';
import {
  createUrqlClient,
  type CreateUrqlClientOptions,
} from './createUrqlClient.js';

export type UrqlClientResolver = () => Client | null | undefined;
export type UrqlClientFactory = () => Client | Promise<Client>;
export type UrqlClientInitializer =
  | Client
  | ClientOptions
  | CreateUrqlClientOptions
  | UrqlClientFactory;
type SsrUrqlClientFactoryInitializer = (factory: UrqlClientFactory) => void;

let urqlClient: Client | null = null;
let urqlClientResolver: UrqlClientResolver | null = null;
let ssrUrqlClientResolver: UrqlClientResolver | null = null;
let ssrUrqlClientFactoryInitializer: SsrUrqlClientFactoryInitializer | null = null;
const URQL_CLIENT_KEY: ExecutionContextKey<Client> =
  createExecutionContextKey<Client>('urql.client');

function isUrqlClient(
  value: Client | ClientOptions | CreateUrqlClientOptions
): value is Client {
  return (
    typeof value === 'object' &&
    value !== null &&
    'query' in value &&
    typeof value.query === 'function' &&
    'mutation' in value &&
    typeof value.mutation === 'function'
  );
}

function isUrqlClientFactory(input: UrqlClientInitializer): input is UrqlClientFactory {
  return typeof input === 'function';
}

function createConfiguredClient(
  input: Client | ClientOptions | CreateUrqlClientOptions
): Client {
  if (isUrqlClient(input)) {
    return input;
  }

  if ('url' in input && !('exchanges' in input) || input.exchanges == null) {
    return createUrqlClient(input as CreateUrqlClientOptions);
  }

  return createClient(input as ClientOptions);
}

export function initializeUrqlClient(input: UrqlClientFactory): Client | void;
export function initializeUrqlClient(
  input: Client | ClientOptions | CreateUrqlClientOptions
): Client;
export function initializeUrqlClient(input: UrqlClientInitializer): Client | void {
  if (isUrqlClientFactory(input)) {
    if (ssrUrqlClientFactoryInitializer) {
      ssrUrqlClientFactoryInitializer(input);
      return;
    }

    const client = input();
    if (client instanceof Promise) {
      throw new Error(
        'initializeUrqlClient() factories must be synchronous in the browser. Async factories are supported during SSR.'
      );
    }
    return initializeUrqlClient(client);
  }

  if (ssrUrqlClientFactoryInitializer) {
    throw new Error(
      'initializeUrqlClient() requires a Client factory during SSR so each render receives an isolated client.'
    );
  }

  if (urqlClient) {
    console.warn('URQL client already initialized, returning existing instance');
    return urqlClient;
  }

  urqlClient = createConfiguredClient(input);
  return urqlClient;
}

/** @internal Configures factory registration for the Node SSR entrypoint. */
export function setSsrUrqlClientFactoryInitializer(
  initializer: SsrUrqlClientFactoryInitializer | null
): void {
  ssrUrqlClientFactoryInitializer = initializer;
}

export function setUrqlClientResolver(
  resolver: UrqlClientResolver | null
): void {
  urqlClientResolver = resolver;
}

/**
 * Registers the resolver used by the server-only SSR scope.
 *
 * This is deliberately kept separate from `setUrqlClientResolver()`: browser
 * applications can continue to own their normal resolver, while the SSR entry
 * point can resolve a client from its request-local scope.
 *
 * @internal
 */
export function setSsrUrqlClientResolver(
  resolver: UrqlClientResolver | null
): void {
  ssrUrqlClientResolver = resolver;
}

export function setUrqlClient(
  context: LitsxExecutionContext,
  client: Client
): void {
  context.set(URQL_CLIENT_KEY, client);
}

export function getExecutionUrqlClient(
  context: LitsxExecutionContext
): Client | undefined {
  return context.get(URQL_CLIENT_KEY);
}

export function getUrqlClient(): Client {
  const executionContext = getCurrentExecutionContext();
  const executionClient = executionContext
    ? getExecutionUrqlClient(executionContext)
    : undefined;
  if (executionClient) {
    return executionClient;
  }

  const ssrResolvedClient = ssrUrqlClientResolver?.() ?? null;
  if (ssrResolvedClient) {
    if (executionContext) {
      setUrqlClient(executionContext, ssrResolvedClient);
    }
    return ssrResolvedClient;
  }

  const resolvedClient = urqlClientResolver?.() ?? null;
  if (resolvedClient) {
    return resolvedClient;
  }

  if (urqlClient) {
    return urqlClient;
  }

  throw new Error(
    'URQL client not resolved. Call initializeUrqlClient() for the app scope, setUrqlClient(...) inside LitSX SSR execution contexts, or register a resolver with setUrqlClientResolver().'
  );
}

export function resetUrqlClient(): void {
  urqlClient = null;
  urqlClientResolver = null;
}
