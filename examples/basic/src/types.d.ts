/// <reference types="lit" />

declare module '@litsx/core' {
  export function useState<T>(
    initialState: T | (() => T)
  ): [T, (value: T) => void];

  export function useAsyncState(
    callback: () => Promise<unknown> | unknown,
    dependencies: readonly unknown[]
  ): void;

  export namespace JSX {
    interface Element {}
    interface ElementClass {}
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicElements {
      [elementName: string]: any;
    }
  }
}

declare module '@litsx/core/jsx-runtime' {
  export const Fragment: unique symbol;
  export function jsx(type: any, props: any, key?: any): any;
  export const jsxs: typeof jsx;
  export const jsxDEV: typeof jsx;
}

declare module '@litsx/urql' {
  import type {
    LitsxExecutionContext,
  } from '@litsx/core';
  import type { Client, ClientOptions } from '@urql/core';

  export interface CreateUrqlClientOptions extends ClientOptions {
    fetchOptions?: RequestInit;
    url: string;
  }

  export function createUrqlClient(
    options: CreateUrqlClientOptions
  ): Client;

  export type UrqlClientResolver = () => Client | null | undefined;

  export function initializeUrqlClient(
    input: Client | ClientOptions
  ): Client;
  export function setUrqlClientResolver(
    resolver: UrqlClientResolver | null
  ): void;
  export function setUrqlClient(
    context: LitsxExecutionContext,
    client: Client
  ): void;
  export function getExecutionUrqlClient(
    context: LitsxExecutionContext
  ): Client | undefined;
  export function getUrqlClient(): Client;
  export function resetUrqlClient(): void;

  export type UseQueryArgs<TVariables = Record<string, any>> = any;
  export type UseMutationArgs<TVariables = Record<string, any>> = any;
  export type UseSubscriptionArgs<TVariables = Record<string, any>> = any;
}
