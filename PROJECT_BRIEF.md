# Markdown Magic - Project Brief

## 1) Problem Statement

Supermarkets with short-dated products (for example salad bags) often rely on manual markdown workflows:

- A team member scans items with an RF gun and confirms markdown eligibility.
- A sticker is manually applied so checkout can charge the reduced price.

This creates friction because checkout pricing depends on manual sticker execution. If a sticker is missed, incorrect billing can occur.

## 2) Pain Points

- Manual sticker dependency introduces human error.
- RF pricing and POS pricing can become inconsistent.
- Short-dated stock moves quickly and is hard to manage lot by lot.
- Multiple expiry dates for the same product increase operational complexity.

## 3) What We Are Fixing

We are replacing sticker-dependent markdown billing with lot-level QR based auto-pricing at checkout.

Specifically, this project fixes:

- Pricing inconsistency between RF and POS.
- Manual handoff gaps between markdown decision and checkout charging.
- Lack of persistent, shared inventory/lot data across sessions.

## 4) Our Solution

Build an inventory + checkout simulation where:

- Each product has one or more lots.
- Each lot has its own use-by date and quantity.
- A lot-level QR encodes product + lot identity.
- Checkout scan resolves the lot and calculates final price automatically.
- Data is persisted in Supabase so inventory and dates survive restarts.
- App is deployed permanently on Vercel for live access.

Markdown business rule currently implemented:

- Expires today -> 50% off
- Expires tomorrow -> 30% off
- Later than tomorrow -> full price
- Past use-by -> do not sell

## 5) How It Works (Operational Flow)

1. Inventory is loaded from cloud database (Supabase).
2. Staff sees lot-level statuses in the app for the selected business date.
3. Customer scans lot QR at billing (camera/scanner input).
4. App resolves QR -> lot -> product -> pricing tier.
5. Discounted price is automatically applied and added to cart.
6. Lot quantity is decremented to reflect sale.

## 6) Expected Outcome

- Checkout applies markdowns automatically for eligible short-dated products.
- No manual sticker dependency for discounted billing.
- Same logic drives both staff-facing and checkout-facing pricing.
- Better customer trust (fewer pricing mismatches).
- Better operational control for short-dated stock handling.

## 7) Scope of Current Prototype

Included:

- Multi-product, multi-lot inventory simulation
- Lot-level QR generation and scanning
- Live POS cart simulation
- Persistent cloud data support (Supabase)
- Permanent web deployment (Vercel)

Not yet included:

- Real RF device integrations
- Real POS system integrations
- Authentication/role-based access
- Audit/compliance reporting

## 8) Success Criteria

- A lot scanned at checkout always resolves to the correct product and lot.
- Markdown rule is applied correctly for today/tomorrow expiries.
- Past use-by lots are blocked from sale.
- Data persists across refresh/restart and across users/devices.

## 9) Future Enhancements

- Admin screens for product and lot lifecycle management.
- Promotion stacking and policy engine.
- Exception handling workflows for overrides.
- Reporting dashboards (sell-through, markdown effectiveness, waste reduction).

