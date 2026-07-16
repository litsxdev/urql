import { useState } from '@litsx/core';
import { css } from 'lit';
import { type SearchProductsQuery, useSearchProductsQuery } from '../graphql';

export function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [result] = useSearchProductsQuery({
    pause: !searchTerm.trim(),
    variables: searchTerm.trim()
      ? {
          input: {
            groupByProduct: true,
            take: 20,
            term: searchTerm,
          },
        }
      : undefined,
  });

  function getPrice(
    price: SearchProductsQuery['search']['items'][0]['price']
  ): string {
    if ('min' in price && 'max' in price) {
      return `${price.min} - ${price.max}`;
    }

    if ('value' in price) {
      return String(price.value);
    }

    return 'N/A';
  }

  const items = result.data?.search.items ?? [];
  const facets = result.data?.search.facetValues ?? [];

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .search-container {
      margin-bottom: 30px;
    }

    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 12px;
      font-size: 14px;
      border: 2px solid #ddd;
      border-radius: 4px;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #2c7a3f;
    }

    .results-container {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 20px;
    }

    .facets-sidebar {
      background: #f9f9f9;
      padding: 16px;
      border-radius: 4px;
      height: fit-content;
    }

    .facet-group {
      margin-bottom: 20px;
    }

    .facet-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }

    .facet-value {
      font-size: 14px;
      margin: 4px 0;
      padding: 4px 8px;
      border-radius: 3px;
    }

    .search-results {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .result-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .result-image {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 4px;
      background: #f5f5f5;
      flex-shrink: 0;
    }

    .result-info {
      flex: 1;
    }

    .result-name {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
    }

    .result-description {
      font-size: 13px;
      color: #666;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    .result-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #999;
    }

    .price-badge {
      background: #f0f9f4;
      color: #2c7a3f;
      padding: 4px 8px;
      border-radius: 3px;
      font-weight: 600;
    }

    .price-with-tax {
      font-size: 12px;
      color: #666;
    }

    .no-results {
      padding: 40px;
      text-align: center;
      color: #999;
    }
  `;

  return (
    <div>
      <h1>Product Search</h1>

      <div class="search-container">
        <input
          class="search-input"
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          @change=${(e: Event) => setSearchTerm((e.target as HTMLInputElement).value)}
        />
      </div>

      {result.error && <div class="no-results">Error: {result.error.message}</div>}

      {result.fetching && <div class="no-results">Searching...</div>}

      {!!items.length && (
        <div class="results-container">
          <aside class="facets-sidebar">
            <div class="facet-group">
              <div class="facet-title">Facet Values</div>
              {facets.map((facet) => (
                <div key={facet.facetValue.id} class="facet-value">
                  {facet.facetValue.name} ({facet.count})
                </div>
              ))}
            </div>
          </aside>

          <div class="search-results">
            {items.map((item) => (
              <article key={`${item.productId}-${item.slug}`} class="result-item">
                {item.productAsset?.preview ? (
                  <img
                    class="result-image"
                    src={item.productAsset.preview}
                    alt={item.productName}
                  />
                ) : (
                  <div class="result-image" />
                )}

                <div class="result-info">
                  <h2 class="result-name">{item.productName}</h2>
                  <p class="result-description">{item.description}</p>
                  <div class="result-meta">
                    <span>{item.sku}</span>
                    <span>{item.currencyCode}</span>
                    <span class="price-badge">{getPrice(item.price)}</span>
                    <span class="price-with-tax">{getPrice(item.priceWithTax)} inc. tax</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!result.fetching && !items.length && searchTerm && (
        <div class="no-results">No results for "{searchTerm}"</div>
      )}
    </div>
  );
}
