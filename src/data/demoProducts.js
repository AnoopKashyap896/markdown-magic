/**
 * Interactive demo products: use-by is derived from the chosen store (scan) date.
 * useByOffsetDays = calendar days AFTER scan date until use-by.
 * - 0 → use-by is the same day as the scan (expires "today" in the simulation).
 */

function addCalendarDays(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export const demoProducts = [
  {
    id: "salad-expires-today",
    name: "Garden Salad Mix 200g",
    aisle: "Produce · chilled salad",
    basePriceCents: 450,
    currency: "AUD",
    useByOffsetDays: 0,
    shelfLifeLabel: "Use-by same day as scan",
  },
  {
    id: "spinach-one-day",
    name: "Baby Spinach 120g",
    aisle: "Produce · leafy greens",
    basePriceCents: 320,
    currency: "AUD",
    useByOffsetDays: 1,
    shelfLifeLabel: "Use-by 1 day after scan",
  },
  {
    id: "caesar-three-day",
    name: "Caesar Kit 250g",
    aisle: "Produce · meal kits",
    basePriceCents: 520,
    currency: "AUD",
    useByOffsetDays: 3,
    shelfLifeLabel: "Use-by 3 days after scan",
  },
  {
    id: "coleslaw-fresh",
    name: "Classic Coleslaw 400g",
    aisle: "Deli",
    basePriceCents: 380,
    currency: "AUD",
    useByOffsetDays: 10,
    shelfLifeLabel: "Use-by 10 days after scan",
  },
];

export const demoProductsById = Object.fromEntries(
  demoProducts.map((p) => [p.id, p])
);

/** Use-by date for this product given the simulated store day. */
export function useByDateForProduct(product, scanDateISO) {
  return addCalendarDays(scanDateISO, product.useByOffsetDays);
}
