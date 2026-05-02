# Markdown Magic (supermarket markdown simulator)

Interactive prototype for lot-level markdown automation at checkout.

## What this version does

- Handles **multiple products**, each with **multiple lots** and different use-by dates.
- Uses lot-level QR format: `mm:v2:<productId>:<lotId>`.
- Applies markdown only for:
  - **expires today** -> 50% off
  - **expires tomorrow** -> 30% off
- For any later date -> full price.
- For past use-by -> blocked as **do not sell**.
- Includes browser camera QR scanning and manual payload scanning.

The pricing rule lives in `src/lib/markdownEngine.js` and is shared across the simulation.

## Run locally

```bash
npm install
npm run serve
```

Open `http://localhost:3456/demo/`.

## Use the simulator

1. Set **Business date**.
2. Check the inventory table:
   - every lot has status and final price for that date.
3. Scan lot QR into POS checkout:
   - `Start camera scan` for real camera input, or
   - paste payload in manual input.
4. See cart totals with markdown applied automatically.
5. Delete any lot from Inventory and its QR test card is removed automatically.

Scanner notes:

- Camera scanner works from `Start camera scan`.
- Hardware scanner guns that type into a text field are supported via **Scanner gun input** (it submits on Enter).
- Use printable labels at `http://localhost:3456/demo/customer-qr-labels.html`.

Holiday markdown planning:

- Standard: markdown expiry **today + tomorrow**.
- If public holidays are configured, the window extends to cover missed markdown operations.
- Example implemented:
  - Holiday on 3rd -> on 1st markdown includes till 3rd.
  - Holiday on 3rd -> on 2nd markdown includes till 4th.

## Add more lots and dates

Use **Add lot** in the UI:

- choose product
- choose use-by date
- set quantity

This gives you smart multi-date inventory behavior for each item.

## Generate QR PNGs

```bash
npm run generate-qrs
```

Outputs are saved in `demo/generated/` for all starter lots.

## Permanent hosting + database (free tier)

This project now supports persistent cloud data with Supabase and permanent hosting on Vercel.

### 1) Create free Supabase project

- Go to [Supabase](https://supabase.com/) and create a new project.
- Open SQL editor and run `supabase/schema.sql`.
- In Project Settings > API, copy:
  - Project URL
  - `anon` public key

### 2) Configure app to use Supabase

- Copy `demo/config.example.js` to `demo/config.js`.
- Paste your Supabase URL/key in `demo/config.js`.
- Start app and confirm header says: **Data mode: Supabase cloud database (persistent)**.

If config is empty/invalid, app falls back to browser localStorage.

### 3) Deploy permanently on Vercel (free)

```bash
npx vercel
```

Then production deploy:

```bash
npx vercel --prod
```

Vercel gives a stable HTTPS URL (not temporary tunnel).

## Temporary public URL (fallback)

If you need quick sharing before Vercel setup:

```bash
npm run serve
npm run tunnel:public
```

This creates a temporary `trycloudflare.com` URL.

## Real-world evolution

- Replace dummy lot memory with DB-backed stock.
- Integrate scanner hardware payload formats (GS1/DataMatrix).
- Add audit logs, user roles, and store-level markdown policy controls.
