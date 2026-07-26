import {
  type Client,
  type ClientOptions,
  cacheExchange,
  createClient,
  fetchExchange,
} from '@urql/core';

export interface CreateUrqlClientOptions
  extends Omit<ClientOptions, 'url' | 'fetchOptions' | 'exchanges'> {
  url: string;
  fetchOptions?: RequestInit;
  exchanges?: ClientOptions['exchanges'];
}

function withGraphqlContentType(fetchOptions?: RequestInit): RequestInit {
  const headers = new Headers(fetchOptions?.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return {
    ...fetchOptions,
    headers,
  };
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
    fetchOptions: withGraphqlContentType(fetchOptions),
    exchanges: exchanges ?? [cacheExchange, fetchExchange],
    ...restOptions,
  });
}
