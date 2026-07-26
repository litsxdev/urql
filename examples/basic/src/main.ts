import '@webcomponents/scoped-custom-element-registry';
import { initializeUrqlClient } from '@litsx/urql';
import { AppRoot } from './components/AppRoot.litsx';

initializeUrqlClient({
  url: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'https://graphqlzero.almansi.me/api',
});

// Register the component
if (!customElements.get('app-root')) {
  customElements.define('app-root', AppRoot as any);
}

console.log('✅ URQL + LitSX app initialized');
console.log('AppRoot component registered as <app-root>');
