/**
 * Dummy QR payload: mm:v1:<lotId>
 * Real devices might use GS1 Digital Link or a short URL + token.
 */
const PREFIX = "mm:v1:";

export function parseQrPayload(raw) {
  const trimmed = String(raw).trim();
  if (!trimmed.toLowerCase().startsWith(PREFIX)) {
    return {
      ok: false,
      error: `Expected payload starting with "${PREFIX}"`,
    };
  }
  const lotId = trimmed.slice(PREFIX.length).trim();
  if (!lotId) {
    return { ok: false, error: "Missing lot id after prefix" };
  }
  return { ok: true, lotId };
}

export function encodeQrPayload(lotId) {
  return `${PREFIX}${lotId}`;
}
