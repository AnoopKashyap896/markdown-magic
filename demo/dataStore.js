import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { products as starterProducts, starterLots } from "../src/data/inventory.js";

const LS_KEY = "markdown-magic-lots-v1";
const LS_HOLIDAY_KEY = "markdown-magic-holidays-v1";

function readConfig() {
  const cfg = globalThis.MARKDOWN_MAGIC_CONFIG || {};
  return {
    supabaseUrl: String(cfg.supabaseUrl || "").trim(),
    supabaseAnonKey: String(cfg.supabaseAnonKey || "").trim(),
  };
}

function isSupabaseConfigured() {
  const cfg = readConfig();
  return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
}

/** YYYY-MM-DD from date input or API (handles ISO timestamps). */
function normalizeUseByDate(raw) {
  const s = String(raw ?? "").trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function normalizeProductId(id) {
  return String(id ?? "").trim();
}

function mapSupabaseRow(row) {
  return {
    lotId: row.lot_id,
    productId: row.product_id,
    useByDate: normalizeUseByDate(row.use_by_date),
    quantity: row.quantity,
    product: {
      id: row.products.id,
      name: row.products.name,
      basePriceCents: row.products.base_price_cents,
      category: row.products.category,
    },
  };
}

function readLocalLots() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    localStorage.setItem(LS_KEY, JSON.stringify(starterLots));
    return starterLots.map((l) => ({ ...l }));
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid local lots");
    return parsed.map((l) => ({ ...l }));
  } catch {
    localStorage.setItem(LS_KEY, JSON.stringify(starterLots));
    return starterLots.map((l) => ({ ...l }));
  }
}

function writeLocalLots(lots) {
  localStorage.setItem(LS_KEY, JSON.stringify(lots));
}

function readLocalHolidays() {
  const raw = localStorage.getItem(LS_HOLIDAY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((h) => h && h.dateISO)
      .map((h) => ({ id: h.id || crypto.randomUUID(), dateISO: h.dateISO, name: h.name || "" }));
  } catch {
    return [];
  }
}

function writeLocalHolidays(holidays) {
  localStorage.setItem(LS_HOLIDAY_KEY, JSON.stringify(holidays));
}

function nextLocalLotId(productId, lots) {
  const prefix = productId.split("-").slice(0, 2).join("").slice(0, 3).toUpperCase();
  let n = 1;
  while (lots.some((l) => l.lotId === `LOT-${prefix}-${String(n).padStart(3, "0")}`)) {
    n += 1;
  }
  return `LOT-${prefix}-${String(n).padStart(3, "0")}`;
}

export function createDataStore(options = {}) {
  if (options.forceLocal || !isSupabaseConfigured()) {
    return {
      mode: "local",
      async init() {
        return;
      },
      async listLots() {
        const lots = readLocalLots();
        return lots.map((lot) => {
          const product = starterProducts.find((p) => p.id === lot.productId);
          return { ...lot, product };
        });
      },
      async addLot({ productId, useByDate, quantity }) {
        const normPid = normalizeProductId(productId);
        const normDate = normalizeUseByDate(useByDate);
        const lots = readLocalLots();
        const addQty = Number(quantity);
        const indices = [];
        for (let i = 0; i < lots.length; i++) {
          if (normalizeProductId(lots[i].productId) === normPid && normalizeUseByDate(lots[i].useByDate) === normDate) {
            indices.push(i);
          }
        }
        if (indices.length > 0) {
          let totalQty = addQty;
          for (const i of indices) totalQty += Number(lots[i].quantity);
          const base = lots[indices[0]];
          const merged = { ...base, productId: normPid, useByDate: normDate, quantity: totalQty };
          const kept = lots.filter((_, i) => !indices.includes(i));
          kept.push(merged);
          writeLocalLots(kept);
          return { merged: true };
        }
        lots.push({
          lotId: nextLocalLotId(normPid, lots),
          productId: normPid,
          useByDate: normDate,
          quantity: addQty,
        });
        writeLocalLots(lots);
        return { merged: false };
      },
      async deleteLot(lotId) {
        const lots = readLocalLots().filter((l) => l.lotId !== lotId);
        writeLocalLots(lots);
      },
      async listHolidays() {
        return readLocalHolidays();
      },
      async addHoliday({ dateISO, name }) {
        const holidays = readLocalHolidays();
        if (holidays.some((h) => h.dateISO === dateISO)) return;
        holidays.push({ id: crypto.randomUUID(), dateISO, name: name || "" });
        holidays.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
        writeLocalHolidays(holidays);
      },
      async deleteHoliday(id) {
        const holidays = readLocalHolidays().filter((h) => h.id !== id);
        writeLocalHolidays(holidays);
      },
      async consumeLot(lotId) {
        const lots = readLocalLots();
        const i = lots.findIndex((l) => l.lotId === lotId);
        if (i < 0) return { ok: false, error: "Lot not found in inventory" };
        if (lots[i].quantity < 1) return { ok: false, error: "This lot is out of stock." };
        lots[i].quantity -= 1;
        writeLocalLots(lots);
        return { ok: true };
      },
    };
  }

  const { supabaseUrl, supabaseAnonKey } = readConfig();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let hasHolidayTable = true;

  return {
    mode: "supabase",
    async init() {
      const { count: productCount, error: pErr } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      if (pErr) throw pErr;
      if (!productCount) {
        const rows = starterProducts.map((p) => ({
          id: p.id,
          name: p.name,
          base_price_cents: p.basePriceCents,
          category: p.category,
        }));
        const { error } = await supabase.from("products").insert(rows);
        if (error) throw error;
      }

      const { count: lotCount, error: lErr } = await supabase
        .from("lots")
        .select("lot_id", { count: "exact", head: true });
      if (lErr) throw lErr;
      if (!lotCount) {
        const rows = starterLots.map((l) => ({
          lot_id: l.lotId,
          product_id: l.productId,
          use_by_date: l.useByDate,
          quantity: l.quantity,
        }));
        const { error } = await supabase.from("lots").insert(rows);
        if (error) throw error;
      }

      const { error: hErr } = await supabase
        .from("public_holidays")
        .select("id", { count: "exact", head: true });
      if (hErr) {
        hasHolidayTable = false;
      }
    },
    async listLots() {
      const { data, error } = await supabase
        .from("lots")
        .select(
          `
          lot_id,
          product_id,
          use_by_date,
          quantity,
          products:products!lots_product_id_fkey (
            id,
            name,
            base_price_cents,
            category
          )
        `
        )
        .order("use_by_date", { ascending: true })
        .order("lot_id", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapSupabaseRow);
    },
    async addLot({ productId, useByDate, quantity }) {
      const normPid = normalizeProductId(productId);
      const normDate = normalizeUseByDate(useByDate);
      const addQty = Number(quantity);

      const { data: matchRows, error: findErr } = await supabase
        .from("lots")
        .select("lot_id, quantity")
        .eq("product_id", normPid)
        .eq("use_by_date", normDate);
      if (findErr) throw findErr;

      const matches = matchRows || [];
      if (matches.length > 0) {
        const existingQty = matches.reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);
        const totalQty = existingQty + addQty;
        const sorted = [...matches].sort((a, b) => a.lot_id.localeCompare(b.lot_id));
        const keepId = sorted[0].lot_id;

        const { error: upErr } = await supabase.from("lots").update({ quantity: totalQty }).eq("lot_id", keepId);
        if (upErr) throw upErr;

        const duplicates = sorted.slice(1).map((r) => r.lot_id);
        if (duplicates.length > 0) {
          const { error: delErr } = await supabase.from("lots").delete().in("lot_id", duplicates);
          if (delErr) throw delErr;
        }
        return { merged: true };
      }

      const { data: maxRows, error: mErr } = await supabase.from("lots").select("lot_id").eq("product_id", normPid);
      if (mErr) throw mErr;
      const prefix = normPid.split("-").slice(0, 2).join("").slice(0, 3).toUpperCase();
      const used = new Set((maxRows || []).map((r) => r.lot_id));
      let n = 1;
      let lotId = `LOT-${prefix}-${String(n).padStart(3, "0")}`;
      while (used.has(lotId)) {
        n += 1;
        lotId = `LOT-${prefix}-${String(n).padStart(3, "0")}`;
      }

      const { error } = await supabase.from("lots").insert({
        lot_id: lotId,
        product_id: normPid,
        use_by_date: normDate,
        quantity: addQty,
      });
      if (error) throw error;
      return { merged: false };
    },
    async deleteLot(lotId) {
      const { error } = await supabase.from("lots").delete().eq("lot_id", lotId);
      if (error) throw error;
    },
    async listHolidays() {
      if (!hasHolidayTable) return [];
      const { data, error } = await supabase
        .from("public_holidays")
        .select("id, holiday_date, name")
        .order("holiday_date", { ascending: true });
      if (error) throw error;
      return (data || []).map((h) => ({
        id: h.id,
        dateISO: h.holiday_date,
        name: h.name || "",
      }));
    },
    async addHoliday({ dateISO, name }) {
      if (!hasHolidayTable) {
        throw new Error("public_holidays table missing. Run updated supabase/schema.sql first.");
      }
      const { error } = await supabase.from("public_holidays").insert({
        holiday_date: dateISO,
        name: name || "",
      });
      if (error && error.code !== "23505") throw error;
    },
    async deleteHoliday(id) {
      if (!hasHolidayTable) return;
      const { error } = await supabase.from("public_holidays").delete().eq("id", id);
      if (error) throw error;
    },
    async consumeLot(lotId) {
      const { data: row, error: fErr } = await supabase
        .from("lots")
        .select("quantity")
        .eq("lot_id", lotId)
        .single();
      if (fErr) return { ok: false, error: "Lot not found in inventory" };
      if (!row || row.quantity < 1) return { ok: false, error: "This lot is out of stock." };
      const { error } = await supabase
        .from("lots")
        .update({ quantity: row.quantity - 1 })
        .eq("lot_id", lotId);
      if (error) return { ok: false, error: "Unable to update stock quantity" };
      return { ok: true };
    },
  };
}
