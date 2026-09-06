# Rajat Kisan | रजत किसान

A bilingual (हिन्दी / English) catalogue of fertilizers and pesticides. Visitors browse
products and prices, then tap through to WhatsApp with the product already written into
the message — there is no cart, no checkout and no customer login. An admin signs in to
manage products, pack sizes, prices and stock.

**No database.** All data lives as JSON in this repository.

---

## How it works

```
Public visitor ──> React SPA ──GET /api/products──> data/products.json ──> WhatsApp deep link
                                                            ▲
Admin ──> /admin ──PUT /api/products/:id──> GitHub Contents API (commit)
```

Vercel's filesystem is read-only at runtime, so the admin panel cannot write to a JSON
file and expect it to survive. Instead, every admin save is **committed back to this
repository** through the GitHub Contents API. The data is genuinely JSON in the repo,
versioned in git, with no database anywhere.

Reads do not wait for a redeploy: `/api/products` fetches from GitHub with a 30-second
CDN cache, so a price change is live within a minute. The admin panel bypasses the cache
and sees its own edits immediately.

Locally (`npm run dev`) there is no GitHub token, so the same code path writes straight
to `data/*.json` on disk.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Vercel Serverless Functions (`/api/*.js`, Node 20) |
| Data | JSON files in `/data` |
| Persistence | GitHub Contents API (prod) · `fs` (dev) |
| Auth | bcrypt + JWT in an HttpOnly cookie |
| Icons | Inline SVG (no icon library) |
| Fonts | Self-hosted Inter + Noto Sans Devanagari |

One repo, one `npm run dev`, one Vercel project. Frontend and backend deploy together.

---

## Running locally

```bash
npm install

# Admin credentials for local development
npm run secret                             # -> paste into JWT_SECRET
npm run hash -- 'your-strong-password'     # -> paste into ADMIN_PASSWORD_HASH
cp .env.example .env.local                 # then fill in the two values above

npm run dev                                # http://localhost:5173
```

- Public site — <http://localhost:5173>
- Admin panel — <http://localhost:5173/admin>

Leave the `GITHUB_*` variables unset locally. The admin sidebar will show
**"Saving to local disk"** so it is obvious you are not writing to the deployed data.

The `/api` functions run inside the Vite dev server (see
[scripts/vite-plugin-api.js](scripts/vite-plugin-api.js)), so the Vercel CLI is not needed.

---

## Environment variables

Copy [.env.example](.env.example) to `.env.local` for development, and set the same
variables in **Vercel → Project → Settings → Environment Variables** for production
(tick Production, Preview and Development).

| Variable | Required | What it is |
|---|---|---|
| `ADMIN_USERNAME` | yes | Admin login name |
| `ADMIN_PASSWORD_HASH` | yes | **bcrypt hash**, not the password — `npm run hash -- 'pw'` |
| `JWT_SECRET` | yes | ≥32 chars, signs the session cookie — `npm run secret` |
| `GITHUB_TOKEN` | production | Fine-grained PAT, **Contents: Read and write**, this repo only |
| `GITHUB_OWNER` | production | Your GitHub username |
| `GITHUB_REPO` | production | This repository's name |
| `GITHUB_BRANCH` | no | Defaults to `main` |

Notes:

- Only `VITE_`-prefixed variables reach the browser. **Never prefix a token with `VITE_`.**
- `ADMIN_PASSWORD_HASH` contains `$` characters. Vercel's dashboard stores it verbatim,
  and the dev loader is written to avoid `$`-expansion — but single-quote it if you ever
  put it in a shell script.
- The WhatsApp number, YouTube URL and contact details are **not** environment variables.
  They live in `data/settings.json` and are editable from Admin → Settings without a redeploy.

---

## Deploying free

Total cost: **₹0** (a custom domain is the only optional expense).

**1. Push to GitHub**

```bash
git remote add origin https://github.com/<you>/sell-agri.git
git push -u origin main
```

**2. Create the GitHub token**

github.com → Settings → Developer settings → **Fine-grained tokens** → Generate new

- Repository access: **Only select repositories** → this repo
- Permissions: Repository → **Contents → Read and write**
- Expiry: 1 year (set a calendar reminder to rotate it)

**3. Deploy on Vercel**

[vercel.com](https://vercel.com) → sign in with GitHub → **Add New → Project** → import
the repo. Framework preset **Vite** is detected automatically. Paste the environment
variables from the table above, then **Deploy**.

Live in about a minute at `https://<project>.vercel.app`, admin at `/admin`.

**4. Set your WhatsApp number**

Sign in to `/admin` → **Settings** → enter your WhatsApp Business number in international
format with no `+` (e.g. `919876543210`) → **Send a test message** to confirm it works.

**5. Optional — custom domain**

Vercel → Settings → Domains → add your domain and follow the DNS instructions. TLS is
automatic and free.

From then on: `git push` redeploys the code; content changes through the admin panel need
no push at all.

### Free-tier limits

| Resource | Hobby limit |
|---|---|
| Bandwidth | 100 GB / month |
| Function invocations | 100 K / month |
| Build minutes | 6 000 / month |
| GitHub API | 5 000 requests / hour (writes only; reads are CDN-cached) |

⚠️ **Vercel's Hobby plan is licensed for non-commercial use.** This site takes no payments,
but it is a business site, and enforcement is at Vercel's discretion. If you want to be
strictly clean, **Cloudflare Pages** and **Netlify** both have free tiers that permit
commercial use and can host this same repo — only the serverless function signatures
would need adapting.

---

## Data files

### `data/products.json`

```jsonc
{
  "id": "p_001",
  "slug": "urea-neem-coated",         // the public URL: /product/<slug>
  "sku": "FRT-URE-001",
  "type": "fertilizer",               // fertilizer | pesticide | seed | equipment
  "category": "nitrogen",             // must match an id in categories.json
  "brand": "IFFCO",
  "technical": "46% N",

  "name":        { "hi": "…", "en": "…" },   // every visible string is a hi/en pair
  "shortDesc":   { "hi": "…", "en": "…" },   // shown on the product card
  "description": { "hi": "…", "en": "…" },
  "usage":       { "hi": "…", "en": "…" },
  "dosage":      { "hi": "…", "en": "…" },
  "safetyNotes": { "hi": "…", "en": "…" },   // rendered in an amber warning box

  "crops": ["wheat", "rice"],
  "images": ["https://cdn.jsdelivr.net/gh/…"],

  "variants": [                              // price and stock live per pack size
    { "id": "v1", "label": { "hi": "45 किग्रा बैग", "en": "45 kg Bag" },
      "mrp": 300, "price": 266.5, "stock": 180, "unit": "bag", "active": true }
  ],

  "featured": true,                          // first 4 featured appear on the home page
  "active": true                             // false hides it without deleting
}
```

### `data/settings.json`

WhatsApp number, message templates, hero copy, contact details. Editable from Admin → Settings.

The message template placeholders are `{{product}}`, `{{variant}}`, `{{price}}`, `{{sku}}`,
`{{url}}` for products, and `{{name}}`, `{{phone}}`, `{{location}}`, `{{crop}}`, `{{area}}`
for the soil-testing enquiry.

### `data/categories.json`

Sub-categories for the products page filter. Each belongs to one `type`.

---

## Admin panel

| Page | What it does |
|---|---|
| **Products** | Table of everything, search, show/hide toggle, delete |
| **Product editor** | Hindi and English fields side by side, pack-size repeater, image upload |
| **Inventory** | Spreadsheet-style price and stock editing — all changes save as **one** commit |
| **Categories** | Add, rename and reorder the filter categories |
| **Settings** | WhatsApp number, message templates, hero copy, contact details |

Images are resized to WebP in the browser, committed to `public/products/`, and served
over the free jsDelivr GitHub CDN so they appear without waiting for a redeploy.

---

## Project layout

```
api/                    Backend — Vercel serverless functions
  _lib/                 store (fs/GitHub), github, auth, validate, http helpers
  auth/                 login, logout, me
  products/             index.js (list/create), [id].js (read/update/delete)
  inventory.js          bulk price + stock update
  categories.js  settings.js  upload.js
data/                   The "database" — products, categories, settings
public/products/        Admin-uploaded images
src/
  i18n/                 LanguageProvider + hi.json / en.json
  lib/                  api client, WhatsApp links, formatting, providers
  components/           Header, Hero, ServicesGrid, SoilTesting, ProductCard, …
  pages/                Home, Products, ProductDetail, NotFound
  pages/admin/          Login, Dashboard, ProductEdit, Inventory, Categories, Settings
scripts/                Dev API plugin, password hasher
```

---

## Security notes

- The session cookie is `HttpOnly; Secure; SameSite=Strict` — not readable by scripts.
- Login is rate-limited to 5 attempts per 15 minutes per IP. Because serverless spreads
  requests across instances this slows an attacker rather than stopping one outright,
  which is why the password must be strong.
- A wrong username and a wrong password take the same time to reject.
- Uploads accept only WebP, JPEG and PNG. SVG is rejected because it can carry scripts.
- Rotate `GITHUB_TOKEN` when it expires; scope it to this one repository only.
