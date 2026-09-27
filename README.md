# LitSX URQL Libraries

Monorepo containing URQL support libraries for **LitSX** (JSX-based framework for building Lit web components).

This is a specialized integration that combines:
- **LitSX** - JSX authoring for Lit components with native hooks
- **URQL** - GraphQL client library  
- **No Provider Pattern** - runtime client resolution without a DOM provider

## What is LitSX?

LitSX is a compiler and framework for authoring Lit-based web components with JSX. It provides:
- Native JSX syntax (not template literals)
- Built-in hooks like `useState`, `useAsyncState`, `useRef`
- Static hoists for styles and properties
- Compile-time property inference from TypeScript
- Babel-based compilation pipeline

Learn more: [litsx.dev](https://litsx.dev)

## Features

- ✅ **URQL Client Setup**: browser app client plus SSR-ready runtime resolution
- ✅ **GraphQL Code Generation**: Integration with LitSX hooks
- ✅ **TypeScript Support**: Full type safety with GraphQL operations
- ✅ **JSX Components**: Write components using LitSX JSX syntax
- ✅ **LitSX Hooks**: Combine URQL with `useState`, `useAsyncState`, etc.

## Packages

- `@litsx/urql` - LitSX runtime, base hooks, client management, and SSR helpers
- `@litsx/urql-codegen` - GraphQL Codegen plugin for LitSX URQL hooks

## Example

- `examples/basic` - standalone reference app showing generated hooks, local schema codegen, and LitSX integration

## Quick Start

### 1. Install Dependencies
```bash
yarn install
```

### 2. Initialize URQL Client
```typescript
// app.tsx
import { initializeUrqlClient } from '@litsx/urql';

initializeUrqlClient({
  url: 'https://your-graphql-endpoint.com/graphql',
});
```

For framework-managed LitSX SSR, configure one request resource during server
startup. Generated server queries and LitSX hooks resolve its native client
without receiving client or cache arguments:

```typescript
import { configureUrqlSsr, createUrqlClient } from '@litsx/urql';

configureUrqlSsr({
  createResource({ request, responseHeaders }) {
    const client = createUrqlClient({
      url: 'https://your-graphql-endpoint.com/graphql',
      fetchOptions: {
        headers: { cookie: request.headers.get('cookie') ?? '' },
      },
    });

    return {
      client,
      extractData: () => undefined,
    };
  },
});
```

Frameworks open the resource with
`runWithUrqlScope({ request, responseHeaders }, render)`. The resource and its
optional `extractData` and `dispose` callbacks remain isolated to that render.
The earlier `initializeUrqlClient(factory)`, `registerSsrUrqlData()` and
`runWithUrqlScope(render)` APIs remain available for compatibility.

The supported Evolit SSR combination is `evolit@0.4.4` or newer,
`@litsx/core@1.0.0-next.8` or newer, and `@litsx/urql@0.4.1` or newer. These
versions use LitSX's contextual hook signatures and keep the server-conditioned
URQL module instance shared across setup, request rendering, data extraction,
and cleanup.

### 3. Use in LitSX Components
```tsx
import { useProductQuery } from './graphql';

export function ProductCard({ id }: { id: string }) {
  const [result, reexecute] = useProductQuery({
    variables: { id },
  });

  return <div>{result.data?.product?.name}</div>;
}
```

## Code Generation

```bash
yarn example:codegen
```

This regenerates the demo output in `examples/basic/src/graphql` using the
example-local schema and `examples/basic/codegen.ts`.
