const PREFIX = "mm:v2:";

/**
 * QR format for lot-level checkout simulation:
 * mm:v2:<productId>:<lotId>
 */
export function encodeLotQr(productId, lotId) {
  return `${PREFIX}${productId}:${lotId}`;
}

export function parseLotQr(raw) {
  const text = String(raw || "").trim();
  if (!text.startsWith(PREFIX)) {
    return { ok: false, error: `Invalid QR format. Expected ${PREFIX}<productId>:<lotId>` };
  }
  const rest = text.slice(PREFIX.length);
  const [productId, lotId] = rest.split(":");
  if (!productId || !lotId) {
    return { ok: false, error: "QR missing productId or lotId" };
  }
  return { ok: true, productId, lotId };
}
