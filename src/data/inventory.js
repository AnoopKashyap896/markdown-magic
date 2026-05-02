/**
 * Demo inventory with multiple products and multiple lot dates.
 * Each lot is the unit encoded into QR for precise markdown decisions.
 */
export const products = [
  { id: "SALAD-MIX-200G", name: "Garden Salad Mix 200g", basePriceCents: 450, category: "Salad bags" },
  { id: "SPINACH-120G", name: "Baby Spinach 120g", basePriceCents: 320, category: "Leafy greens" },
  { id: "CAESAR-KIT-250G", name: "Caesar Kit 250g", basePriceCents: 520, category: "Meal kits" },
  { id: "COLESLAW-400G", name: "Classic Coleslaw 400g", basePriceCents: 380, category: "Deli salads" },
];

export const productById = Object.fromEntries(products.map((p) => [p.id, p]));

export const starterLots = [
  { lotId: "LOT-SAL-001", productId: "SALAD-MIX-200G", useByDate: "2026-03-20", quantity: 12 },
  { lotId: "LOT-SAL-002", productId: "SALAD-MIX-200G", useByDate: "2026-03-21", quantity: 8 },
  { lotId: "LOT-SAL-003", productId: "SALAD-MIX-200G", useByDate: "2026-03-24", quantity: 10 },
  { lotId: "LOT-SPI-001", productId: "SPINACH-120G", useByDate: "2026-03-20", quantity: 14 },
  { lotId: "LOT-SPI-002", productId: "SPINACH-120G", useByDate: "2026-03-21", quantity: 9 },
  { lotId: "LOT-CAE-001", productId: "CAESAR-KIT-250G", useByDate: "2026-03-21", quantity: 7 },
  { lotId: "LOT-COL-001", productId: "COLESLAW-400G", useByDate: "2026-03-26", quantity: 16 },
];

export function cloneStarterLots() {
  return starterLots.map((l) => ({ ...l }));
}
