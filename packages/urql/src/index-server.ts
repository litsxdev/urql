import './server.js';

export * from './index.js';
export {
  configureUrqlSsr,
  getUrqlSsrData,
  registerSsrUrqlData,
  runWithUrqlScope,
} from './server.js';
export type {
  SsrUrqlDataExtractor,
  UrqlSsrConfiguration,
  UrqlSsrRequestContext,
  UrqlSsrResource,
  UrqlSsrResourceFactory,
} from './server.js';
