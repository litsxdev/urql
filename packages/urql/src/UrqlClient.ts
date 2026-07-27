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

let urqlClient: Client | null = null;
let urqlClientResolver: UrqlClientResolver | null = null;
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

export function initializeUrqlClient(
  input: Client | ClientOptions | CreateUrqlClientOptions
): Client {
  if (urqlClient) {
    console.warn('URQL client already initialized, returning existing instance');
    return urqlClient;
  }

  urqlClient = createConfiguredClient(input);
  return urqlClient;
}

export function setUrqlClientResolver(
  resolver: UrqlClientResolver | null
): void {
  urqlClientResolver = resolver;
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
