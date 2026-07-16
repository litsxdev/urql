import * as Types from './types';

import { gql, type Client, type OperationContext } from '@urql/core';
import {
  type UseMutationArgs,
  type UseQueryArgs,
  type UseSubscriptionArgs,
  Omit,
  executeMutation,
  executeQuery,
  useMutation,
  useQuery,
  useSubscription,
} from '@litsx/urql';
import type {
  GetProductsQuery,
  GetProductsQueryVariables,
  GetProductQuery,
  GetProductQueryVariables,
  SearchProductsQuery,
  SearchProductsQueryVariables,
  GetCollectionsQuery,
  GetCollectionsQueryVariables,
  GetCollectionQuery,
  GetCollectionQueryVariables,
  GetActiveChannelQuery,
  GetActiveChannelQueryVariables,
  GetAvailableCountriesQuery,
  GetAvailableCountriesQueryVariables,
} from './types';

export type {
  GetProductsQuery,
  GetProductsQueryVariables,
  GetProductQuery,
  GetProductQueryVariables,
  SearchProductsQuery,
  SearchProductsQueryVariables,
  GetCollectionsQuery,
  GetCollectionsQueryVariables,
  GetCollectionQuery,
  GetCollectionQueryVariables,
  GetActiveChannelQuery,
  GetActiveChannelQueryVariables,
  GetAvailableCountriesQuery,
  GetAvailableCountriesQueryVariables,
} from './types';

export const GetProductsDocument = gql<GetProductsQuery, GetProductsQueryVariables>(`query GetProducts($options: ProductListOptions) {
  products(options: $options) {
    items {
      id
      name
      slug
      description
      enabled
      featuredAsset {
        id
        preview
        name
      }
      assets {
        id
        preview
        name
      }
      variants {
        id
        name
        sku
        priceWithTax
        currencyCode
        stockLevel
        featuredAsset {
          id
          preview
        }
      }
      facetValues {
        id
        name
      }
    }
    totalItems
  }
}`);


export const GetProductDocument = gql<GetProductQuery, GetProductQueryVariables>(`query GetProduct($id: ID, $slug: String) {
  product(id: $id, slug: $slug) {
    id
    name
    slug
    description
    enabled
    languageCode
    createdAt
    updatedAt
    featuredAsset {
      id
      preview
      name
      mimeType
    }
    assets {
      id
      preview
      name
      tags {
        id
        value
      }
    }
    variants {
      id
      name
      sku
      priceWithTax
      price
      currencyCode
      stockLevel
      languageCode
      featuredAsset {
        id
        preview
      }
      options {
        id
        name
        code
      }
    }
    collections {
      id
      name
      slug
    }
    optionGroups {
      id
      name
      code
      options {
        id
        name
        code
      }
    }
  }
}`);


export const SearchProductsDocument = gql<SearchProductsQuery, SearchProductsQueryVariables>(`query SearchProducts($input: SearchInput!) {
  search(input: $input) {
    items {
      productId
      productName
      slug
      description
      sku
      score
      currencyCode
      productAsset {
        preview
        id
      }
      productVariantAsset {
        preview
        id
      }
      price {
        ... on PriceRange {
          min
          max
        }
        ... on SinglePrice {
          value
        }
      }
      priceWithTax {
        ... on PriceRange {
          min
          max
        }
        ... on SinglePrice {
          value
        }
      }
      facetIds
      collectionIds
    }
    totalItems
    facetValues {
      count
      facetValue {
        id
        name
        code
      }
    }
    collections {
      count
      collection {
        id
        name
        slug
      }
    }
  }
}`);


export const GetCollectionsDocument = gql<GetCollectionsQuery, GetCollectionsQueryVariables>(`query GetCollections($options: CollectionListOptions) {
  collections(options: $options) {
    items {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
      }
      parent {
        id
        name
      }
      children {
        id
        name
      }
    }
    totalItems
  }
}`);


export const GetCollectionDocument = gql<GetCollectionQuery, GetCollectionQueryVariables>(`query GetCollection($id: ID, $slug: String) {
  collection(id: $id, slug: $slug) {
    id
    name
    slug
    description
    featuredAsset {
      id
      preview
    }
    parent {
      id
      name
    }
    children {
      id
      name
    }
    breadcrumbs {
      id
      name
      slug
    }
  }
}`);


export const GetActiveChannelDocument = gql<GetActiveChannelQuery, GetActiveChannelQueryVariables>(`query GetActiveChannel {
  activeChannel {
    id
    code
    token
    defaultLanguageCode
    currencyCode
    pricesIncludeTax
  }
}`);


export const GetAvailableCountriesDocument = gql<GetAvailableCountriesQuery, GetAvailableCountriesQueryVariables>(`query GetAvailableCountries {
  availableCountries {
    id
    code
    name
    enabled
  }
}`);


export function useGetProductsQuery(options?: Omit<UseQueryArgs<GetProductsQueryVariables>, 'query'> = {}) {
  return useQuery<GetProductsQuery, GetProductsQueryVariables>({
    query: GetProductsDocument,
    ...options,
  });
}

export async function ssrGetProductsQuery(
  variables: GetProductsQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetProductsQuery, GetProductsQueryVariables>(
    GetProductsDocument,
    variables,
    context,
    client
  );
}


export function useGetProductQuery(options?: Omit<UseQueryArgs<GetProductQueryVariables>, 'query'> = {}) {
  return useQuery<GetProductQuery, GetProductQueryVariables>({
    query: GetProductDocument,
    ...options,
  });
}

export async function ssrGetProductQuery(
  variables: GetProductQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetProductQuery, GetProductQueryVariables>(
    GetProductDocument,
    variables,
    context,
    client
  );
}


export function useSearchProductsQuery(options?: Omit<UseQueryArgs<SearchProductsQueryVariables>, 'query'> = {}) {
  return useQuery<SearchProductsQuery, SearchProductsQueryVariables>({
    query: SearchProductsDocument,
    ...options,
  });
}

export async function ssrSearchProductsQuery(
  variables: SearchProductsQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<SearchProductsQuery, SearchProductsQueryVariables>(
    SearchProductsDocument,
    variables,
    context,
    client
  );
}


export function useGetCollectionsQuery(options?: Omit<UseQueryArgs<GetCollectionsQueryVariables>, 'query'> = {}) {
  return useQuery<GetCollectionsQuery, GetCollectionsQueryVariables>({
    query: GetCollectionsDocument,
    ...options,
  });
}

export async function ssrGetCollectionsQuery(
  variables: GetCollectionsQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetCollectionsQuery, GetCollectionsQueryVariables>(
    GetCollectionsDocument,
    variables,
    context,
    client
  );
}


export function useGetCollectionQuery(options?: Omit<UseQueryArgs<GetCollectionQueryVariables>, 'query'> = {}) {
  return useQuery<GetCollectionQuery, GetCollectionQueryVariables>({
    query: GetCollectionDocument,
    ...options,
  });
}

export async function ssrGetCollectionQuery(
  variables: GetCollectionQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetCollectionQuery, GetCollectionQueryVariables>(
    GetCollectionDocument,
    variables,
    context,
    client
  );
}


export function useGetActiveChannelQuery(options?: Omit<UseQueryArgs<GetActiveChannelQueryVariables>, 'query'> = {}) {
  return useQuery<GetActiveChannelQuery, GetActiveChannelQueryVariables>({
    query: GetActiveChannelDocument,
    ...options,
  });
}

export async function ssrGetActiveChannelQuery(
  variables: GetActiveChannelQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetActiveChannelQuery, GetActiveChannelQueryVariables>(
    GetActiveChannelDocument,
    variables,
    context,
    client
  );
}


export function useGetAvailableCountriesQuery(options?: Omit<UseQueryArgs<GetAvailableCountriesQueryVariables>, 'query'> = {}) {
  return useQuery<GetAvailableCountriesQuery, GetAvailableCountriesQueryVariables>({
    query: GetAvailableCountriesDocument,
    ...options,
  });
}

export async function ssrGetAvailableCountriesQuery(
  variables: GetAvailableCountriesQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetAvailableCountriesQuery, GetAvailableCountriesQueryVariables>(
    GetAvailableCountriesDocument,
    variables,
    context,
    client
  );
}
