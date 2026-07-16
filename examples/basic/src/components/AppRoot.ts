import { useState, useAsyncState } from '@litsx/core';
import { getUrqlClient } from '@litsx/urql';
import { css } from 'lit';

/**
 * Example LitSX component using URQL for data fetching
 * 
 * This demonstrates how to:
 * - Initialize URQL client once
 * - Use LitSX hooks (useState, useAsyncState)
 * - Combine with GraphQL queries
 * - Handle loading and error states
 */
export function AppRoot() {
  const [initialized, setInitialized] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  useAsyncState(async () => {
    try {
      getUrqlClient();
      setStatus('✅ URQL client initialized successfully');
      setInitialized(true);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  static styles = css`
    :host {
      font-family: system-ui, -apple-system, sans-serif;
      display: block;
      padding: 2rem;
    }

    h1 {
      color: #333;
      margin: 0 0 1rem 0;
    }

    .status {
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
    }

    .status.success {
      border-left-color: #4caf50;
      background: #e8f5e9;
    }

    .status.error {
      border-left-color: #f44336;
      background: #ffebee;
    }

    .info {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 4px;
    }

    .code {
      background: #f5f5f5;
      padding: 0.5rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    .feature-list {
      margin: 1rem 0;
      padding: 0;
      list-style: none;
    }

    .feature-list li {
      padding: 0.5rem 0;
    }

    .feature-list li::before {
      content: '✓ ';
      color: #4caf50;
      font-weight: bold;
      margin-right: 0.5rem;
    }
  `;

  return (
    <section>
      <h1>🚀 URQL + LitSX</h1>
      
      <div class={`status ${initialized ? 'success' : 'error'}`}>
        {status}
      </div>

      {initialized && (
        <div class="info">
          <h2>Ready to use!</h2>
          <p>The URQL client is initialized and ready for GraphQL queries.</p>
          
          <h3>Next steps:</h3>
          <ul class="feature-list">
            <li>Define GraphQL queries in <span class="code">.graphql</span> files</li>
            <li>Run <span class="code">yarn codegen</span> to generate types and hooks</li>
            <li>Use generated LitSX hooks like <span class="code">useGetProductsQuery()</span></li>
            <li>Read <span class="code">data</span>, <span class="code">fetching</span> and <span class="code">error</span> directly from the hook result</li>
          </ul>

          <h3>Example:</h3>
          <pre style={{
            background: '#f5f5f5',
            padding: '1rem',
            'border-radius': '4px',
            overflow: 'auto'
          }}>
{`import { useState, useAsyncState } from '@litsx/core';
import { useGetProductQuery } from '../graphql';

export function MyComponent() {
  const [result, reexecute] = useGetProductQuery({
    variables: { id: '123' },
  });

  return <div>{result.data?.product?.name}</div>;
}`}
          </pre>
        </div>
      )}
    </section>
  );
}
