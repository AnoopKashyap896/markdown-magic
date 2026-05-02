import { computeMarkdown } from "./markdownEngine.js";
import { productById } from "../data/inventory.js";
import { parseLotQr } from "./qrV2.js";

export function priceLotForDate(lot, scanDateISO, holidayDatesISO = []) {
  const product = productById[lot.productId];
  if (!product) {
    return { ok: false, error: `Unknown product for lot ${lot.lotId}` };
  }
  const pricing = computeMarkdown(lot.useByDate, scanDateISO, product.basePriceCents, {
    holidayDatesISO,
  });
  return { ok: true, product, lot, pricing };
}

export function resolveQrToPricedLot(qrText, lots, scanDateISO, holidayDatesISO = []) {
  const parsed = parseLotQr(qrText);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  const lot = lots.find((l) => l.productId === parsed.productId && l.lotId === parsed.lotId);
  if (!lot) {
    return { ok: false, error: "Lot not found in inventory" };
  }
  return priceLotForDate(lot, scanDateISO, holidayDatesISO);
}
