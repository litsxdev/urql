import { describe, expect, it } from 'vitest';
import { cacheExchange, fetchExchange } from '@urql/core';
import { createUrqlClient } from './createUrqlClient';

describe('createUrqlClient', () => {
  it('creates a client with the default urql exchanges', () => {
    const client = createUrqlClient({
      url: 'https://example.test/graphql',
    });

    expect(client).toBeTruthy();
    expect(typeof client.query).toBe('function');
    expect(typeof client.mutation).toBe('function');
    expect(typeof client.subscription).toBe('function');
  });

  it('preserves explicit exchanges and forwards fetchOptions', () => {
    const client = createUrqlClient({
      url: 'https://example.test/graphql',
      exchanges: [cacheExchange, fetchExchange],
      fetchOptions: {
        headers: {
          authorization: 'Bearer token',
        },
      },
    });

    expect(client).toBeTruthy();
    expect(typeof client.query).toBe('function');
  });
});
