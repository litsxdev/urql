# @litsx/urql

## 0.4.2

### Patch Changes

- 02e69a0: Keep query, mutation, and subscription observers in contextual LitSX refs so SSR hydration serializes only their JSON-compatible state snapshots.

## 0.4.1

### Patch Changes

- ddcae3c: Use the contextual `useState(initializer)` and `useAfterUpdate(callback, dependencies)` LitSX hook APIs in `useQuery`, `useMutation`, and `useSubscription`, and require `@litsx/core@1.0.0-next.8` or newer.

## 0.4.0

### Minor Changes

- fdeccba: Add request-scoped SSR resources with HTTP request context, per-request data extraction, and deterministic disposal while preserving the existing SSR factory APIs.

## 0.3.0

### Minor Changes

- 571b22e: Add request-scoped, memoized native URQL clients for SSR through the
  isomorphic `@litsx/urql` entrypoint, including optional application-defined
  SSR data extraction.

## 0.2.1

### Patch Changes

- 676d6d0: Fix the published ESM runtime so it can be imported by strict Node ESM consumers.

## 0.2.0

### Minor Changes

- 88b732a: Prepare the URQL runtime and GraphQL Code Generator plugin for public release, including package metadata, distributable entrypoints, and improved client configuration support.
