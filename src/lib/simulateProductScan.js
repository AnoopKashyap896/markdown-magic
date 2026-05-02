import { computeMarkdown } from "./markdownEngine.js";
import { demoProductsById, useByDateForProduct } from "../data/demoProducts.js";

/**
 * POS / RF simulation: same pricing for a catalog product and store day.
 *
 * @param {string} productId
 * @param {string} scanDateISO
 */
export function simulateProductScan(productId, scanDateISO) {
  const product = demoProductsById[productId];
  if (!product) {
    return { ok: false, error: `Unknown product: ${productId}` };
  }

  const useByDate = useByDateForProduct(product, scanDateISO);
  const pricing = computeMarkdown(useByDate, scanDateISO, product.basePriceCents);

  return {
    ok: true,
    productId: product.id,
    label: product.name,
    aisle: product.aisle,
    scanDate: scanDateISO,
    useByDate,
    basePriceCents: product.basePriceCents,
    currency: product.currency,
    pricing,
  };
}
