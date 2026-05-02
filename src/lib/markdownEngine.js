/**
 * Single source of truth for markdown tiers.
 * Standard rule: markdown for products expiring today/tomorrow.
 * Holiday enhancement: if upcoming public holidays reduce markdown operations,
 * expand the eligible expiry window on earlier days.
 *
 * @param {string} useByDateISO - YYYY-MM-DD (store local date; demo uses plain calendar days)
 * @param {string} scanDateISO - YYYY-MM-DD when the scan happens
 * @param {number} basePriceCents
 * @param {{ holidayDatesISO?: string[] }} [options]
 * @returns {{ tier: string, discountPercent: number, finalPriceCents: number, reason: string }}
 */
export function computeMarkdown(useByDateISO, scanDateISO, basePriceCents, options = {}) {
  const useBy = parseLocalDate(useByDateISO);
  const scanned = parseLocalDate(scanDateISO);
  const daysToUseBy = diffCalendarDays(scanned, useBy);
  const holidaySet = new Set((options.holidayDatesISO || []).map((d) => String(d).trim()));
  const extensionDays = computeHolidayExtension(scanDateISO, holidaySet);
  const maxMarkdownDays = 1 + extensionDays;

  let discountPercent = 0;
  let tier = "full";

  if (daysToUseBy < 0) {
    return {
      tier: "do-not-sell",
      discountPercent: 0,
      finalPriceCents: basePriceCents,
      reason: "Past use-by — not for sale (dummy rule)",
    };
  }
  if (daysToUseBy === 0) {
    discountPercent = 50;
    tier = "expires-today";
  } else if (daysToUseBy === 1) {
    discountPercent = 30;
    tier = "expires-tomorrow";
  } else if (daysToUseBy <= maxMarkdownDays) {
    discountPercent = 20;
    tier = "holiday-extended";
  }

  const finalPriceCents = roundCents(
    basePriceCents * (1 - discountPercent / 100)
  );

  return {
    tier,
    discountPercent,
    finalPriceCents,
    reason:
      discountPercent > 0
        ? `${discountPercent}% off (${tier})`
        : "No markdown — outside today/tomorrow + holiday extension window",
  };
}

function computeHolidayExtension(scanDateISO, holidaySet) {
  // Base window is 1 day (today + tomorrow). If public holidays are near,
  // we extend to cover days that would be missed operationally.
  let extension = 0;
  while (true) {
    const startOffset = 1;
    const endOffset = 2 + extension;
    let holidayCount = 0;
    for (let i = startOffset; i <= endOffset; i++) {
      if (holidaySet.has(addDaysISO(scanDateISO, i))) holidayCount += 1;
    }
    if (holidayCount === extension) return extension;
    extension = holidayCount;
  }
}

function parseLocalDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function diffCalendarDays(fromDate, toDate) {
  const MS = 86400000;
  const a = Math.floor(fromDate.getTime() / MS);
  const b = Math.floor(toDate.getTime() / MS);
  return b - a;
}

function roundCents(n) {
  return Math.round(n);
}

function addDaysISO(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
