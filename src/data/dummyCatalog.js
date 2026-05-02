/**
 * Dummy catalog: salad bags with lot-level expiry and base retail price.
 * QR payloads reference lotId; in production this would come from your WMS/ERP.
 */
export const dummyLots = {
  /** Long dated — use for “new” bag QR tests (no markdown in normal years). */
  "LOT-DEMO-NEW": {
    sku: "SAL-DEMO-NEW",
    lotId: "LOT-DEMO-NEW",
    useByDate: "2040-06-15",
    basePriceCents: 450,
    currency: "AUD",
    label: "Demo — new / full price",
  },
  /** Short dated vs scan — set scan date to 2030-03-31 to get 35% off (1 day before use-by). */
  "LOT-DEMO-OLD": {
    sku: "SAL-DEMO-OLD",
    lotId: "LOT-DEMO-OLD",
    useByDate: "2030-04-01",
    basePriceCents: 450,
    currency: "AUD",
    label: "Demo — nearing use-by",
  },
  "LOT-2025-03-22-A": {
    sku: "SAL-MIX-200G",
    lotId: "LOT-2025-03-22-A",
    useByDate: "2025-03-22",
    basePriceCents: 450,
    currency: "AUD",
    label: "Garden Salad Mix 200g",
  },
  "LOT-2025-03-19-B": {
    sku: "SAL-SPIN-120G",
    lotId: "LOT-2025-03-19-B",
    useByDate: "2025-03-19",
    basePriceCents: 320,
    currency: "AUD",
    label: "Baby Spinach 120g",
  },
  "LOT-2025-03-25-C": {
    sku: "SAL-CAES-250G",
    lotId: "LOT-2025-03-25-C",
    useByDate: "2025-03-25",
    basePriceCents: 520,
    currency: "AUD",
    label: "Caesar Kit 250g",
  },
};

export const productsBySku = {
  "SAL-DEMO-NEW": { name: "Demo salad — new", category: "salad-bag" },
  "SAL-DEMO-OLD": { name: "Demo salad — old", category: "salad-bag" },
  "SAL-MIX-200G": { name: "Garden Salad Mix 200g", category: "salad-bag" },
  "SAL-SPIN-120G": { name: "Baby Spinach 120g", category: "salad-bag" },
  "SAL-CAES-250G": { name: "Caesar Kit 250g", category: "salad-bag" },
};
