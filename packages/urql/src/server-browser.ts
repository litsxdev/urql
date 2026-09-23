function unavailable(name: string): never {
  throw new Error(`${name} is only available from @litsx/urql during a Node SSR render.`);
}

export function configureUrqlSsr(): never {
  return unavailable('configureUrqlSsr()');
}

export function registerSsrUrqlData(): never {
  return unavailable('registerSsrUrqlData()');
}

export function runWithUrqlScope(): never {
  return unavailable('runWithUrqlScope()');
}

export function getUrqlSsrData(): never {
  return unavailable('getUrqlSsrData()');
}
