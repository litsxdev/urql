import { initializeUrqlClient } from '@litsx/urql';
import { AppRoot } from './components/AppRoot';

initializeUrqlClient({
  url: process.env.GRAPHQL_ENDPOINT || 'https://demo.vendure.io/shop-api',
});

// Register the component
if (!customElements.get('app-root')) {
  customElements.define('app-root', AppRoot as any);
}

console.log('✅ URQL + LitSX app initialized');
console.log('AppRoot component registered as <app-root>');
