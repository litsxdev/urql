import { css } from 'lit';
import {
  type GetProductsQuery,
  useGetProductsQuery,
} from '../graphql';

export function ProductCatalog() {
  const [result] = useGetProductsQuery({
    variables: {
      options: {
        skip: 0,
        take: 20,
      },
    },
  });

  const products: GetProductsQuery['products']['items'] =
    result.data?.products.items ?? [];

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .product-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 12px;
      background: #f5f5f5;
    }

    .product-name {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
    }

    .product-description {
      font-size: 14px;
      color: #666;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }

    .variants {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }

    .variant {
      font-size: 13px;
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .variant-name {
      color: #555;
    }

    .variant-price {
      font-weight: 600;
      color: #2c7a3f;
    }

    .variant-stock {
      font-size: 12px;
      color: #999;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .error {
      background: #fee;
      color: #c33;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .no-image {
      background: linear-gradient(135deg, #f5f5f5 25%, transparent 25%);
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
  `;

  if (result.fetching && !result.data) {
    return <div class="loading">Loading products...</div>;
  }

  return (
    <div>
      {result.error && <div class="error">Error: {result.error.message}</div>}

      <h1>Product Catalog</h1>
      <p>Showing {products.length} products</p>

      <div class="product-grid">
        {products.map((product) => (
          <div key={product.id} class="product-card">
            {product.featuredAsset?.preview ? (
              <img
                class="product-image"
                src={product.featuredAsset.preview}
                alt={product.name}
              />
            ) : (
              <div class="no-image">No image</div>
            )}

            <h2 class="product-name">{product.name}</h2>

            {product.description && (
              <p class="product-description">{product.description}</p>
            )}

            <small style="color: #999;">/{product.slug}</small>

            {product.variants.length > 0 && (
              <div class="variants">
                <strong>Variants:</strong>
                {product.variants.map((variant) => (
                  <div key={variant.id} class="variant">
                    <span class="variant-name">
                      {variant.name}
                      {variant.featuredAsset?.preview ? ' image' : ''}
                    </span>
                    <span class="variant-price">{variant.priceWithTax}</span>
                    <span class="variant-stock">Stock: {variant.stockLevel}</span>
                  </div>
                ))}
              </div>
            )}

            {product.facetValues.length > 0 && (
              <div style="margin-top: 12px; font-size: 12px;">
                <strong>Tags:</strong>{' '}
                {product.facetValues.map((facetValue) => facetValue.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {!result.fetching && products.length === 0 && (
        <div style="text-align: center; padding: 40px; color: #999;">
          No products found
        </div>
      )}
    </div>
  );
}
