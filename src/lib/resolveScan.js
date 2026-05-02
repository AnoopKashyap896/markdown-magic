import { dummyLots } from "../data/dummyCatalog.js";
import { computeMarkdown } from "./markdownEngine.js";
import { parseQrPayload } from "./qr.js";

/**
 * @param {"rf" | "pos"} device
 * @param {string} qrRaw
 * @param {string} scanDateISO YYYY-MM-DD
 */
export function resolveScan(device, qrRaw, scanDateISO) {
  const parsed = parseQrPayload(qrRaw);
  if (!parsed.ok) {
    return { ok: false, device, error: parsed.error };
  }

  const lot = dummyLots[parsed.lotId];
  if (!lot) {
    return {
      ok: false,
      device,
      error: `Unknown lot: ${parsed.lotId}`,
    };
  }

  const pricing = computeMarkdown(lot.useByDate, scanDateISO, lot.basePriceCents);

  return {
    ok: true,
    device,
    lotId: lot.lotId,
    sku: lot.sku,
    label: lot.label,
    useByDate: lot.useByDate,
    basePriceCents: lot.basePriceCents,
    currency: lot.currency,
    pricing,
    /** Same logic for RF and POS; UI copy can differ by device. */
    message:
      device === "rf"
        ? `Handheld: show $${(pricing.finalPriceCents / 100).toFixed(2)} on gun`
        : `POS: charge $${(pricing.finalPriceCents / 100).toFixed(2)} (no sticker needed)`,
  };
}
