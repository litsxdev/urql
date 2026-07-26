import * as Types from './types';

import { gql, type Client, type OperationContext } from '@urql/core';
import {
  type UseMutationArgs,
  type UseQueryArgs,
  type UseSubscriptionArgs,
  executeMutation,
  executeQuery,
  useMutation,
  useQuery,
  useSubscription,
} from '@litsx/urql';
import type {
  GetUsersQuery,
  GetUsersQueryVariables,
  GetUserQuery,
  GetUserQueryVariables,
  SearchPostsQuery,
  SearchPostsQueryVariables,
  GetAlbumsQuery,
  GetAlbumsQueryVariables,
} from './types';

export type {
  GetUsersQuery,
  GetUsersQueryVariables,
  GetUserQuery,
  GetUserQueryVariables,
  SearchPostsQuery,
  SearchPostsQueryVariables,
  GetAlbumsQuery,
  GetAlbumsQueryVariables,
} from './types';

export const GetUsersDocument = gql<GetUsersQuery, GetUsersQueryVariables>(`query GetUsers($options: PageQueryOptions) {
  users(options: $options) {
    data {
      id
      name
      username
      email
      phone
      website
      company {
        name
        catchPhrase
      }
      address {
        city
        street
        zipcode
        geo {
          lat
          lng
        }
      }
    }
    meta {
      totalCount
    }
  }
}`);


export const GetUserDocument = gql<GetUserQuery, GetUserQueryVariables>(`query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    username
    email
    phone
    website
    company {
      name
      catchPhrase
      bs
    }
    address {
      street
      suite
      city
      zipcode
      geo {
        lat
        lng
      }
    }
    posts(options: {paginate: {page: 1, limit: 3}}) {
      data {
        id
        title
      }
    }
    albums(options: {paginate: {page: 1, limit: 2}}) {
      data {
        id
        title
      }
    }
    todos(options: {paginate: {page: 1, limit: 4}}) {
      data {
        id
        title
        completed
      }
    }
  }
}`);


export const SearchPostsDocument = gql<SearchPostsQuery, SearchPostsQueryVariables>(`query SearchPosts($options: PageQueryOptions) {
  posts(options: $options) {
    data {
      id
      title
      body
      user {
        id
        name
        username
      }
      comments(options: {paginate: {page: 1, limit: 2}}) {
        data {
          id
          name
          email
        }
      }
    }
    meta {
      totalCount
    }
  }
}`);


export const GetAlbumsDocument = gql<GetAlbumsQuery, GetAlbumsQueryVariables>(`query GetAlbums($options: PageQueryOptions) {
  albums(options: $options) {
    data {
      id
      title
      user {
        id
        name
      }
      photos(options: {paginate: {page: 1, limit: 3}}) {
        data {
          id
          title
          thumbnailUrl
        }
      }
    }
    meta {
      totalCount
    }
  }
}`);


export function useGetUsersQuery(options: Omit<UseQueryArgs<GetUsersQueryVariables>, 'query'> = {}) {
  return useQuery<GetUsersQuery, GetUsersQueryVariables>({
    query: GetUsersDocument,
    ...options,
  });
}

export async function ssrGetUsersQuery(
  variables: GetUsersQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetUsersQuery, GetUsersQueryVariables>(
    GetUsersDocument,
    variables,
    context,
    client
  );
}


export function useGetUserQuery(options: Omit<UseQueryArgs<GetUserQueryVariables>, 'query'> = {}) {
  return useQuery<GetUserQuery, GetUserQueryVariables>({
    query: GetUserDocument,
    ...options,
  });
}

export async function ssrGetUserQuery(
  variables: GetUserQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetUserQuery, GetUserQueryVariables>(
    GetUserDocument,
    variables,
    context,
    client
  );
}


export function useSearchPostsQuery(options: Omit<UseQueryArgs<SearchPostsQueryVariables>, 'query'> = {}) {
  return useQuery<SearchPostsQuery, SearchPostsQueryVariables>({
    query: SearchPostsDocument,
    ...options,
  });
}

export async function ssrSearchPostsQuery(
  variables: SearchPostsQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<SearchPostsQuery, SearchPostsQueryVariables>(
    SearchPostsDocument,
    variables,
    context,
    client
  );
}


export function useGetAlbumsQuery(options: Omit<UseQueryArgs<GetAlbumsQueryVariables>, 'query'> = {}) {
  return useQuery<GetAlbumsQuery, GetAlbumsQueryVariables>({
    query: GetAlbumsDocument,
    ...options,
  });
}

export async function ssrGetAlbumsQuery(
  variables: GetAlbumsQueryVariables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<GetAlbumsQuery, GetAlbumsQueryVariables>(
    GetAlbumsDocument,
    variables,
    context,
    client
  );
}
