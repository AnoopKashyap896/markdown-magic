import QRCode from "qrcode";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeLotQr } from "../src/lib/qrV2.js";
import { starterLots } from "../src/data/inventory.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "demo", "generated");

const hostArg = process.argv.find((a) => a.startsWith("--host="));
const lanHost = hostArg?.split("=", 2)[1]?.trim();

const pairs = starterLots.map((lot) => ({
  file: `qr-${lot.productId.toLowerCase()}-${lot.lotId.toLowerCase()}.png`,
  text: encodeLotQr(lot.productId, lot.lotId),
  label: `${lot.productId} · ${lot.lotId} · use-by ${lot.useByDate}`,
}));

await mkdir(outDir, { recursive: true });

const pngOpts = {
  type: "png",
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
};

for (const { file, text, label } of pairs) {
  const path = join(outDir, file);
  await QRCode.toFile(path, text, pngOpts);
  console.log(`${label}\n  → ${text}\n  → ${path}\n`);
}

if (lanHost) {
  const base = `http://${lanHost}:3456/demo/`;
  const urlPairs = [{ file: "qr-url-open-demo.png", url: base, label: "URL → open demo home" }];
  for (const { file, url, label } of urlPairs) {
    const path = join(outDir, file);
    await QRCode.toFile(path, url, { ...pngOpts, errorCorrectionLevel: "Q" });
    console.log(`${label}\n  → ${url}\n  → ${path}\n`);
  }
} else {
  console.log(
    "Tip: pass --host=192.168.x.x (your PC on Wi‑Fi) to also write qr-url-open-*.png for phone scans.\n"
  );
}

console.log("Done. Open demo/qr-codes.html after `npm run serve`, or print the PNGs.");
