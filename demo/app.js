import { products, productById } from "../src/data/inventory.js";
import { encodeLotQr } from "../src/lib/qrV2.js";
import { priceLotForDate, resolveQrToPricedLot } from "../src/lib/inventoryPricing.js";
import { createDataStore } from "./dataStore.js";

const $ = (id) => document.getElementById(id);
const currency = "AUD";
let store = createDataStore();
const state = {
  lots: [],
  holidays: [],
  cart: [],
  scanner: null,
  scanInProgress: false,
  lastPayload: "",
  lastPayloadAtMs: 0,
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMoney(cents, ccy = "AUD") {
  const n = (cents / 100).toFixed(2);
  return ccy === "AUD" ? `$${n}` : `${n} ${ccy}`;
}

function businessDate() {
  return $("scanDate").value || todayISO();
}

function statusFromPricing(pricing) {
  if (pricing.tier === "do-not-sell") return "Do not sell";
  if (pricing.discountPercent > 0) return `${pricing.discountPercent}% markdown`;
  return "Full price";
}

function renderInventory() {
  const body = $("lotsBody");
  const date = businessDate();
  body.innerHTML = "";
  for (const lot of state.lots) {
    const priced = priceLotForDate(
      lot,
      date,
      state.holidays.map((h) => h.dateISO)
    );
    if (!priced.ok) continue;
    const { product, pricing } = priced;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${lot.lotId}</td>
      <td>${lot.useByDate}</td>
      <td>${lot.quantity}</td>
      <td>${statusFromPricing(pricing)}</td>
      <td>${formatMoney(product.basePriceCents, currency)}</td>
      <td>${pricing.tier === "do-not-sell" ? "N/A" : formatMoney(pricing.finalPriceCents, currency)}</td>
      <td><code>${encodeLotQr(product.id, lot.lotId)}</code></td>
      <td>
        <div class="row-actions">
          <button class="mini" data-add="${lot.lotId}" data-product="${product.id}" ${lot.quantity < 1 ? "disabled" : ""}>Add to cart</button>
          <button class="mini danger" data-delete-lot="${lot.lotId}">Delete</button>
        </div>
      </td>
    `;
    body.appendChild(row);
  }
  body.querySelectorAll("button[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const payload = encodeLotQr(btn.dataset.product, btn.dataset.add);
      handleScan(payload).catch((err) => setFeedback(String(err), true));
    });
  });
  body.querySelectorAll("button[data-delete-lot]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await store.deleteLot(btn.dataset.deleteLot);
      await reloadLots();
      renderInventory();
      renderQrCards();
      setFeedback(`Lot ${btn.dataset.deleteLot} deleted. QR test card removed.`);
    });
  });
}

async function reloadLots() {
  state.lots = await store.listLots();
}

async function reloadHolidays() {
  state.holidays = await store.listHolidays();
}

function renderQrCards() {
  const root = $("qrCards");
  root.innerHTML = "";
  for (const lot of state.lots) {
    const product = productById[lot.productId];
    const payload = encodeLotQr(lot.productId, lot.lotId);
    const card = document.createElement("article");
    card.className = "qr-card";
    card.innerHTML = `
      <h4>${product.name}</h4>
      <p>Lot ${lot.lotId} · use-by ${lot.useByDate}</p>
      <div class="qr-box"></div>
      <code>${payload}</code>
    `;
    root.appendChild(card);
    if (window.QRCode) {
      // global from qrcodejs script
      // eslint-disable-next-line no-new
      new QRCode(card.querySelector(".qr-box"), { text: payload, width: 120, height: 120 });
    }
  }
}

function renderHolidayList() {
  const root = $("holidayList");
  root.innerHTML = "";
  if (!state.holidays.length) {
    root.innerHTML = "<li>No public holidays added.</li>";
    return;
  }
  for (const h of state.holidays) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${h.dateISO}${h.name ? ` - ${h.name}` : ""}</span>
      <button class="mini danger" data-delete-holiday="${h.id}">Delete</button>
    `;
    root.appendChild(li);
  }
  root.querySelectorAll("button[data-delete-holiday]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await store.deleteHoliday(btn.dataset.deleteHoliday);
      await reloadHolidays();
      renderHolidayList();
      renderInventory();
      setFeedback("Public holiday deleted.");
    });
  });
}

function renderCart() {
  const list = $("cartList");
  list.innerHTML = "";
  let total = 0;
  for (const item of state.cart) {
    total += item.finalPriceCents;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.productName} (${item.lotId})</span>
      <span>${formatMoney(item.finalPriceCents, currency)}</span>
    `;
    list.appendChild(li);
  }
  $("cartTotal").textContent = formatMoney(total, currency);
}

function setFeedback(message, isError = false) {
  const el = $("scanFeedback");
  el.textContent = message;
  el.classList.toggle("error", isError);
}

function renderRecognizedScan(resolved, payload) {
  $("recognizedProduct").textContent = `${resolved.product.name} (${resolved.lot.lotId})`;
  $("recognizedMeta").textContent = `Use-by ${resolved.lot.useByDate} · payload ${payload}`;
  const p = resolved.pricing;
  const priceText =
    p.tier === "do-not-sell"
      ? "Blocked: past use-by"
      : `${formatMoney(resolved.product.basePriceCents)} → ${formatMoney(p.finalPriceCents)} (${p.reason})`;
  $("recognizedPrice").textContent = priceText;
}

async function handleScan(rawPayload) {
  const payload = String(rawPayload || "").trim();
  if (!payload) {
    setFeedback("Scan payload is empty.", true);
    return;
  }
  const now = Date.now();
  if (payload === state.lastPayload && now - state.lastPayloadAtMs < 900) {
    return;
  }
  state.lastPayload = payload;
  state.lastPayloadAtMs = now;

  const resolved = resolveQrToPricedLot(
    payload,
    state.lots,
    businessDate(),
    state.holidays.map((h) => h.dateISO)
  );
  if (!resolved.ok) {
    setFeedback(resolved.error, true);
    return;
  }
  renderRecognizedScan(resolved, payload);
  if (resolved.pricing.tier === "do-not-sell") {
    setFeedback("Past use-by lot blocked from checkout.", true);
    return;
  }
  if (resolved.lot.quantity < 1) {
    setFeedback("This lot is out of stock.", true);
    return;
  }
  const consumed = await store.consumeLot(resolved.lot.lotId);
  if (!consumed.ok) {
    setFeedback(consumed.error || "Unable to consume lot.", true);
    return;
  }
  state.cart.push({
    productName: resolved.product.name,
    lotId: resolved.lot.lotId,
    finalPriceCents: resolved.pricing.finalPriceCents,
  });
  setFeedback(
    `${resolved.product.name} (${resolved.lot.lotId}) added at ${formatMoney(resolved.pricing.finalPriceCents)}`
  );
  await reloadLots();
  renderCart();
  renderInventory();
}

function renderProductOptions() {
  const select = $("newProduct");
  select.innerHTML = "";
  for (const p of products) {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} (${formatMoney(p.basePriceCents, currency)})`;
    select.appendChild(option);
  }
}

function bindAddLotForm() {
  $("addLotForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const productId = $("newProduct").value;
    const useByDate = $("newUseBy").value;
    const quantity = Number($("newQty").value);
    if (!productId || !useByDate || Number.isNaN(quantity) || quantity < 1) {
      setFeedback("Provide valid product, use-by date, and quantity.", true);
      return;
    }
    const added = await store.addLot({ productId, useByDate, quantity });
    await reloadLots();
    renderInventory();
    renderQrCards();
    setFeedback(added.merged ? "Quantity added to existing lot (same product and use-by)." : "New lot added.");
    $("addLotForm").reset();
    $("newQty").value = "1";
  });
}

function bindHolidayForm() {
  $("addHolidayForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const dateISO = $("holidayDate").value;
    const name = $("holidayName").value.trim();
    if (!dateISO) {
      setFeedback("Select a valid holiday date.", true);
      return;
    }
    await store.addHoliday({ dateISO, name });
    await reloadHolidays();
    renderHolidayList();
    renderInventory();
    setFeedback("Public holiday added. Markdown window updated.");
    $("addHolidayForm").reset();
  });
}

async function startCamera() {
  if (!window.Html5Qrcode) {
    setFeedback("Camera scanner library failed to load.", true);
    return;
  }
  if (state.scanner) return;
  const scanner = new window.Html5Qrcode("qrReader");
  try {
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        formatsToSupport: [window.Html5QrcodeSupportedFormats.QR_CODE],
      },
      (decodedText) => {
        if (state.scanInProgress) return;
        state.scanInProgress = true;
        handleScan(decodedText).catch((err) => setFeedback(String(err), true));
        setTimeout(() => {
          state.scanInProgress = false;
        }, 800);
      }
    );
    state.scanner = scanner;
    setFeedback("Camera scanner started. Point camera at lot QR.");
  } catch (err) {
    setFeedback(`Unable to start camera: ${String(err)}`, true);
  }
}

async function stopCamera() {
  if (!state.scanner) return;
  await state.scanner.stop();
  await state.scanner.clear();
  state.scanner = null;
  setFeedback("Camera scanner stopped.");
}

function bindCheckoutActions() {
  $("scannerInput").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleScan(e.currentTarget.value).catch((err) => setFeedback(String(err), true));
    e.currentTarget.value = "";
  });
  $("scanManual").addEventListener("click", () => {
    handleScan($("manualQr").value).catch((err) => setFeedback(String(err), true));
  });
  $("manualQr").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleScan(e.currentTarget.value).catch((err) => setFeedback(String(err), true));
  });
  $("startCamera").addEventListener("click", startCamera);
  $("stopCamera").addEventListener("click", stopCamera);
  $("clearCart").addEventListener("click", () => {
    state.cart = [];
    renderCart();
    setFeedback("Cart cleared.");
  });
}

async function init() {
  $("scanDate").value = todayISO();
  $("newUseBy").value = todayISO();
  renderProductOptions();
  $("dataMode").textContent =
    store.mode === "supabase"
      ? "Data mode: Supabase cloud database (persistent)"
      : "Data mode: Browser local storage (set Supabase keys in demo/config.js for permanent storage)";
  try {
    await store.init();
    await reloadLots();
    await reloadHolidays();
  } catch (err) {
    store = createDataStore({ forceLocal: true });
    await store.init();
    await reloadLots();
    await reloadHolidays();
    $("dataMode").textContent = "Data mode: Supabase unavailable, using local storage fallback.";
    console.error(err);
  }
  bindAddLotForm();
  bindHolidayForm();
  bindCheckoutActions();
  $("scanDate").addEventListener("change", async () => {
    await reloadLots();
    await reloadHolidays();
    renderInventory();
    renderHolidayList();
    setFeedback("Business date updated.");
  });
  renderInventory();
  renderHolidayList();
  renderQrCards();
  renderCart();
}

init().catch((err) => setFeedback(String(err), true));
