const { Kind, print, visit } = require('graphql');

function collectFragmentNames(selectionSet, names = new Set()) {
  if (!selectionSet) {
    return names;
  }

  visit(selectionSet, {
    FragmentSpread(node) {
      names.add(node.name.value);
    },
  });

  return names;
}

function collectReferencedFragments(operation, fragmentMap, collected = new Map()) {
  const names = collectFragmentNames(operation.selectionSet);
  for (const name of names) {
    if (collected.has(name)) {
      continue;
    }

    const fragment = fragmentMap.get(name);
    if (!fragment) {
      continue;
    }

    collected.set(name, fragment);
    collectReferencedFragments(fragment, fragmentMap, collected);
  }

  return [...collected.values()];
}

function printOperationDocument(operation, fragmentMap) {
  const definitions = [
    operation,
    ...collectReferencedFragments(operation, fragmentMap),
  ];

  return print({
    kind: Kind.DOCUMENT,
    definitions,
  });
}

function pascalCaseOperationKind(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function createHook(operationName, operationKind, dataTypeName) {
  if (operationKind === 'query') {
    return `
export function use${operationName}Query(options: Omit<UseQueryArgs<${dataTypeName}Variables>, 'query'> = {}) {
  return useQuery<${dataTypeName}, ${dataTypeName}Variables>({
    query: ${operationName}Document,
    ...options,
  });
}

export async function ssr${operationName}Query(
  variables: ${dataTypeName}Variables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeQuery<${dataTypeName}, ${dataTypeName}Variables>(
    ${operationName}Document,
    variables,
    context,
    client
  );
}
`;
  }

  if (operationKind === 'mutation') {
    return `
export function use${operationName}Mutation(options?: Omit<UseMutationArgs<${dataTypeName}Variables>, 'mutation'>) {
  return useMutation<${dataTypeName}, ${dataTypeName}Variables>({
    mutation: ${operationName}Document,
    ...options,
  });
}

export async function ssr${operationName}Mutation(
  variables: ${dataTypeName}Variables,
  context?: Partial<OperationContext>,
  client?: Client
) {
  return executeMutation<${dataTypeName}, ${dataTypeName}Variables>(
    ${operationName}Document,
    variables,
    context,
    client
  );
}
`;
  }

  return `
export function use${operationName}Subscription(options?: Omit<UseSubscriptionArgs<${dataTypeName}Variables>, 'subscription'>) {
  return useSubscription<${dataTypeName}, ${dataTypeName}Variables>({
    subscription: ${operationName}Document,
    ...options,
  });
}
`;
}

module.exports = {
  plugin(_schema, documents, config) {
    const operations = [];
    const typeNames = [];
    const fragmentMap = new Map();

    for (const doc of documents) {
      for (const definition of doc.document?.definitions ?? []) {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          fragmentMap.set(definition.name.value, definition);
        }
      }
    }

    for (const doc of documents) {
      for (const definition of doc.document?.definitions ?? []) {
        if (
          definition.kind !== Kind.OPERATION_DEFINITION ||
          !definition.name?.value
        ) {
          continue;
        }

        const operationName = definition.name.value;
        const kindSuffix = pascalCaseOperationKind(definition.operation);
        const dataTypeName = `${operationName}${kindSuffix}`;
        const variablesTypeName = `${dataTypeName}Variables`;
        const source = printOperationDocument(definition, fragmentMap);

        operations.push({
          dataTypeName,
          kind: definition.operation,
          operationName,
          source,
          variablesTypeName,
        });

        typeNames.push(dataTypeName, variablesTypeName);
      }
    }

    if (!operations.length) {
      return '';
    }

    const documentDeclarations = operations
      .map(
        ({ dataTypeName, operationName, source, variablesTypeName }) => `
export const ${operationName}Document = gql<${dataTypeName}, ${variablesTypeName}>(\`${source}\`);
`
      )
      .join('\n');

    const hookDeclarations = operations
      .map(({ dataTypeName, kind, operationName }) =>
        createHook(operationName, kind, dataTypeName)
      )
      .join('\n');

    return `import { gql, type Client, type OperationContext } from '@urql/core';
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
  ${typeNames.join(',\n  ')},
} from '${config.typesImportFrom || './types'}';

export type {
  ${typeNames.join(',\n  ')},
} from '${config.typesImportFrom || './types'}';
${documentDeclarations}
${hookDeclarations}`;
  },
};
