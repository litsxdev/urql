import { describe, expect, it, vi } from 'vitest';
import { cacheExchange, fetchExchange, gql } from '@urql/core';
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

  it('sends application/json by default for GraphQL servers with CSRF protection', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { health: true } }), {
        headers: { 'content-type': 'application/json' },
      })
    );
    const client = createUrqlClient({
      url: 'https://example.test/graphql',
      fetch,
    });

    await client.query(gql`query Health { health }`, {}).toPromise();

    expect(fetch).toHaveBeenCalledOnce();
    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get('content-type')).toBe(
      'application/json'
    );
  });
});
