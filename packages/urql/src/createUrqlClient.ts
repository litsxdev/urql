import {
  type Client,
  type ClientOptions,
  cacheExchange,
  createClient,
  fetchExchange,
} from '@urql/core';

export interface CreateUrqlClientOptions extends ClientOptions {
  url: string;
  fetchOptions?: RequestInit;
}

/**
 * Create and configure a URQL client for use in litsx applications
 * @param options Configuration options including GraphQL endpoint URL
 * @returns Configured URQL Client instance
 */
export function createUrqlClient(
  options: CreateUrqlClientOptions
): Client {
  const { url, fetchOptions, exchanges, ...restOptions } = options;

  return createClient({
    url,
    fetchOptions,
    exchanges: exchanges ?? [cacheExchange, fetchExchange],
    ...restOptions,
  });
}
