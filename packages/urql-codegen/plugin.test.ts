import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'graphql';
import pluginModule from './plugin.cjs';

type GraphqlDocument = {
  document: ReturnType<typeof parse>;
};

const plugin = (pluginModule as {
  plugin: (
    schema: unknown,
    documents: GraphqlDocument[],
    config: Record<string, unknown>
  ) => string;
}).plugin;

function runPlugin(source: string, config: Record<string, unknown> = {}) {
  return plugin(
    null,
    [
      {
        document: parse(source),
      },
    ],
    config
  );
}

describe('@litsx/urql-codegen plugin', () => {
  it('returns an empty string when no named operations are present', () => {
    const output = runPlugin(`
      fragment ProductFields on Product {
        id
        name
      }
    `);

    expect(output).toBe('');
  });

  it('generates query hooks and SSR helpers with the LitSX runtime imports', () => {
    const output = runPlugin(
      `
        query GetProducts($term: String) {
          products(term: $term) {
            id
          }
        }
      `,
      { typesImportFrom: './generated-types' }
    );

    expect(output).toContain(
      `import { gql, type Client, type OperationContext } from '@urql/core';`
    );
    expect(output).toContain(`from '@litsx/urql';`);
    expect(output).toContain(`from './generated-types';`);
    expect(output).toContain(
      `export const GetProductsDocument = gql<GetProductsQuery, GetProductsQueryVariables>`
    );
    expect(output).toContain(`export function useGetProductsQuery(`);
    expect(output).toContain(`query: GetProductsDocument,`);
    expect(output).toContain(`return useQuery<GetProductsQuery, GetProductsQueryVariables>`);
    expect(output).toContain(`export async function ssrGetProductsQuery(`);
    expect(output).toContain(`return executeQuery<GetProductsQuery, GetProductsQueryVariables>(`);
  });

  it('generates mutation hooks and SSR mutation helpers', () => {
    const output = runPlugin(`
      mutation UpdateProduct($id: ID!) {
        updateProduct(id: $id) {
          id
        }
      }
    `);

    expect(output).toContain(`export function useUpdateProductMutation(`);
    expect(output).toContain(`mutation: UpdateProductDocument,`);
    expect(output).toContain(
      `return useMutation<UpdateProductMutation, UpdateProductMutationVariables>`
    );
    expect(output).toContain(`export async function ssrUpdateProductMutation(`);
    expect(output).toContain(
      `return executeMutation<UpdateProductMutation, UpdateProductMutationVariables>(`
    );
  });

  it('generates subscription hooks without emitting SSR subscription helpers', () => {
    const output = runPlugin(`
      subscription ProductUpdates($id: ID!) {
        productUpdates(id: $id) {
          id
        }
      }
    `);

    expect(output).toContain(`export function useProductUpdatesSubscription(`);
    expect(output).toContain(`subscription: ProductUpdatesDocument,`);
    expect(output).toContain(
      `return useSubscription<ProductUpdatesSubscription, ProductUpdatesSubscriptionVariables>`
    );
    expect(output).not.toContain(`ssrProductUpdatesSubscription`);
  });

  it('includes referenced fragments in generated operation documents', () => {
    const output = runPlugin(`
      fragment MoneyFields on Money {
        currency
      }

      fragment ProductFields on Product {
        id
        price {
          ...MoneyFields
        }
      }

      query GetProduct($id: ID!) {
        product(id: $id) {
          ...ProductFields
        }
      }
    `);

    expect(output).toContain(`fragment ProductFields on Product`);
    expect(output).toContain(`fragment MoneyFields on Money`);
    expect(output).toContain(`...ProductFields`);
    expect(output).toContain(`...MoneyFields`);
  });

  it('keeps the current optional-plus-nullable semantics in generated example types', () => {
    const generatedTypesPath = path.resolve(
      __dirname,
      '../../examples/basic/src/graphql/types.ts'
    );
    const generatedTypes = fs.readFileSync(generatedTypesPath, 'utf8');

    expect(generatedTypes).toContain(`city?: Maybe<Scalars['String']['output']>;`);
    expect(generatedTypes).toContain(`country: Country;`);
    expect(generatedTypes).toContain(`createdAt: Scalars['DateTime']['output'];`);
    expect(generatedTypes).toContain(`streetLine1: Scalars['String']['output'];`);
    expect(generatedTypes).toContain(`streetLine2?: Maybe<Scalars['String']['output']>;`);
    expect(generatedTypes).toContain(`updatedAt: Scalars['DateTime']['output'];`);

    expect(generatedTypes).toContain(`product?: { __typename?: 'Product'`);
    expect(generatedTypes).toContain(`featuredAsset?: { __typename?: 'Asset'`);
    expect(generatedTypes).toContain(`parent?: { __typename?: 'Collection'`);
  });
});
