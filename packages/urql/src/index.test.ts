import { describe, expect, it, vi } from 'vitest';
import type { ExecutionContextKey } from '@litsx/core';

vi.mock('@litsx/core', () => ({
  createExecutionContextKey: <T>() =>
    Object.freeze({
      __key: 'index-test-key',
    }) as ExecutionContextKey<T>,
  getCurrentExecutionContext: () => null,
  useAsyncState: () => undefined,
  useState<T>(value: T | (() => T)) {
    const resolvedValue =
      typeof value === 'function' ? (value as () => T)() : value;
    return [resolvedValue, () => undefined] as const;
  },
}));

import * as packageExports from './index';
import { createUrqlClient } from './createUrqlClient';
import {
  getExecutionUrqlClient,
  getUrqlClient,
  initializeUrqlClient,
  resetUrqlClient,
  setUrqlClient,
  setUrqlClientResolver,
} from './UrqlClient';
import {
  executeMutation,
  executeQuery,
  executeSubscription,
  getDocumentLabel,
  useMutation,
  useQuery,
  useSubscription,
} from './hooks';

describe('package barrel exports', () => {
  it('re-exports the runtime surface from the package entrypoint', () => {
    expect(packageExports.createUrqlClient).toBe(createUrqlClient);
    expect(packageExports.initializeUrqlClient).toBe(initializeUrqlClient);
    expect(packageExports.setUrqlClientResolver).toBe(setUrqlClientResolver);
    expect(packageExports.setUrqlClient).toBe(setUrqlClient);
    expect(packageExports.getExecutionUrqlClient).toBe(getExecutionUrqlClient);
    expect(packageExports.getUrqlClient).toBe(getUrqlClient);
    expect(packageExports.resetUrqlClient).toBe(resetUrqlClient);
    expect(packageExports.useQuery).toBe(useQuery);
    expect(packageExports.useMutation).toBe(useMutation);
    expect(packageExports.useSubscription).toBe(useSubscription);
    expect(packageExports.executeQuery).toBe(executeQuery);
    expect(packageExports.executeMutation).toBe(executeMutation);
    expect(packageExports.executeSubscription).toBe(executeSubscription);
    expect(packageExports.getDocumentLabel).toBe(getDocumentLabel);
  });
});
