import { CodegenConfig } from "@graphql-codegen/cli";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const config: CodegenConfig = {
  overwrite: true,
  schema: path.join(rootDir, "graphqlzero-schema.graphql"),
  documents: [path.join(rootDir, "src/graphql/**/*.graphql")],
  config: {
    scalars: {
      ID: "string",
      DateTime: "string",
      JSON: "Record<string, any>",
    },
    namingConvention: {
      enumValues: "keep",
    },
  },
  generates: {
    [path.join(rootDir, "src/graphql/types.ts")]: {
      plugins: ["typescript", "typescript-operations"],
    },
    [path.join(rootDir, "src/graphql/")]: {
      preset: "near-operation-file",
      presetConfig: {
        extension: ".ts",
        baseTypesPath: "./types",
        fileName: "index",
      },
      plugins: [path.join(rootDir, "../../packages/urql-codegen/plugin.cjs")],
      config: {
        typesImportFrom: "./types",
      },
    },
  },
};

export default config;
