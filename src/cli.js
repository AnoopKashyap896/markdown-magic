#!/usr/bin/env node
import { resolveScan } from "./lib/resolveScan.js";
import { encodeQrPayload } from "./lib/qr.js";
import { dummyLots } from "./data/dummyCatalog.js";

function printHelp() {
  console.log(`
Markdown Magic — dummy scan simulator

Usage:
  node src/cli.js scan --device rf|pos --qr "<payload>" [--date YYYY-MM-DD]
  node src/cli.js lots

QR payload format: mm:v1:<LOT_ID>

Example:
  node src/cli.js scan --device pos --qr "mm:v1:LOT-2025-03-19-B" --date 2025-03-18
`);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") {
    printHelp();
    process.exit(0);
  }

  if (argv[0] === "lots") {
    console.log("Dummy lots (use these in QR as mm:v1:<lotId>):\n");
    for (const lot of Object.values(dummyLots)) {
      console.log(
        `  ${encodeQrPayload(lot.lotId)}  use-by ${lot.useByDate}  base $${(lot.basePriceCents / 100).toFixed(2)}`
      );
    }
    process.exit(0);
  }

  if (argv[0] !== "scan") {
    console.error("Unknown command. Try: scan | lots | --help");
    process.exit(1);
  }

  let device = null;
  let qr = null;
  let date = todayISO();

  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--device" && argv[i + 1]) {
      device = argv[++i];
    } else if (a === "--qr" && argv[i + 1]) {
      qr = argv[++i];
    } else if (a === "--date" && argv[i + 1]) {
      date = argv[++i];
    }
  }

  if (!device || !["rf", "pos"].includes(device)) {
    console.error('Pass --device rf or --device pos');
    process.exit(1);
  }
  if (!qr) {
    console.error("Pass --qr \"mm:v1:LOT-...\"");
    process.exit(1);
  }

  const result = resolveScan(device, qr, date);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main();
