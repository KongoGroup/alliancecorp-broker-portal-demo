# AllianceCorp Broker Portal — Demo Mockup

Clickable HTML mockup of an external broker portal, built to demo what a
HubSpot Content Hub Professional + Private Content (Memberships) implementation
would look like for AllianceCorp's external broker channel.

**Audience:** AllianceCorp executives in the Section 3 segment of the
implementation pitch. Not production code.

---

## Run it

No build step. Tailwind loads from CDN; everything else is static.

```bash
cd mockup
python3 -m http.server 8080
# then open http://localhost:8080
```

Or `npx http-server -p 8080`. Any static server will do.

---

## What's where

```
mockup/
├── index.html          → login (entry point of the demo)
├── dashboard.html      → broker home view
├── deals.html          → My Deals table with filters + Firm View toggle
├── deal-detail.html    → 6-tab deal view (Finance is the hero)
├── stock.html          → Stock Pipeline card grid
├── resources.html      → Gated content library
├── css/styles.css      → brand tokens + components
├── js/
│   ├── app.js          → utilities, icons, badges, toast, modal, stage bar
│   ├── components.js   → shared header (with view toggle) + footer
│   ├── dashboard.js, deals.js, deal-detail.js, stock.js, resources.js
└── data/
    ├── broker.json     → logged-in broker + firm + AC contact
    ├── deals.json      → 15 deals (6 for Marcus Webb, 9 firm-wide)
    ├── stock.json      → 8 property stock records
    ├── valuations.json → 5 linked valuation records
    ├── activity.json   → 8 recent activity entries
    └── resources.json  → 6 resource cards
```

---

## What was extracted from alliancecorp.com.au

Run on 2026-04-28 against `https://www.alliancecorp.com.au/` (Elementor kit-5
globals from `post-5.css`):

| Token         | Value     | Usage                                   |
|---------------|-----------|------------------------------------------|
| Brand navy    | `#03267D` | Primary — header, headings, hero, CTAs  |
| Brand gold    | `#D0A117` | Accent — premium CTAs, status, dividers |
| Light blue    | `#6EC1E4` | Secondary brand blue                    |
| Accent green  | `#61CE70` | Success                                 |
| Secondary     | `#54595F` | Body headings                           |
| Body text     | `#7A7A7A` | Body copy                               |
| Background    | `#F8F8F8` | Page background                         |
| Heading font  | Gotham Bold | Hosted on alliancecorp.com.au's CDN  |
| Body font     | Gotham Book | Hosted on alliancecorp.com.au's CDN  |
| Logo          | `cropped-AC-WEBSITE-WIREFRAME-1.png` from AC's `/wp-content/uploads/2023/05/` |
| Container     | 1140px (matches Elementor container max-width) |
| Heading style | ALL CAPS sub-headings with `letter-spacing: 2.5px` (premium pattern from kit) |

Tokens live in `css/styles.css` `:root`; fonts are linked directly from
AllianceCorp's CDN via `@font-face`. Internet connectivity required at first
load to fetch fonts and logo.

---

## Mock data — anchored to the Fibonacci HubSpot demo

The mockup uses the same brokers, clients and properties as the existing
Fibonacci HubSpot demo (portal 3475354), so the broker portal can be shown
side-by-side with the actual HubSpot data without inconsistencies.

- **Logged-in broker:** Marcus Webb · Senior Mortgage Broker · Meridian Mortgage Group (External Partner)
- **Firm colleagues** (invented for the demo so the Firm View toggle has
  enough deals to show): Olivia Park, Daniel Singh, Rebecca Horton.
- **Clients reused from Fibonacci:** Harrison/Chen, Patel, Okafor, Nguyen,
  Whitmore, McLeod, Thornton SMSF (where relevant).
- **Properties reused from Fibonacci:** Donnybrook, Craigieburn, Pakenham,
  Point Cook, Truganina, Officer, Tarneit, Wollert, Clyde North, Logan QLD,
  Palmview QLD, Mickleham, Rockbank.

State is in-memory only. Reload resets — by design for a demo.

---

## What's mocked vs what's real

**Mocked:**
- Authentication — any credentials sign in and persist via `localStorage`.
- Saving finance fields — writes to in-memory state and shows the success
  toast. No real CRM update.
- File uploads / downloads — buttons toast a "demo only" message.
- Valuation requests, broker chase actions — toast feedback only.

**Real:**
- The brand tokens, fonts and logo all come from the live AllianceCorp site.
- All 7 stages and the property/finance data structure follow the data model
  in `alliancecorp_hubspot_data_model.md`.
- Property addresses, builders, and yields are realistic — anchored to the
  Fibonacci demo data.

---

## Running the executive demo

The brief specifies a 4-minute walkthrough. Suggested path:

1. **Login page** — frame: branded gated entry on AC's domain.
2. **Sign in** → Dashboard — frame: only their world, no HubSpot UI.
3. **Toggle Firm View** — frame: optional firm-level visibility, configurable.
4. **Click Harrison/Chen Donnybrook** → Finance tab — frame: this is the
   magic. Update fields, hit Save, toast confirms write-back to HubSpot.
5. **Stock Pipeline** — frame: extending value to the broker channel.
6. Land on: "Twelve external brokers plugged into your CRM without a
   partner community licence, without double entry, and on your brand."

---

## What a real Content Hub build would replace

| Mockup behaviour                          | Production replacement                                     |
|-------------------------------------------|------------------------------------------------------------|
| `localStorage` auth flag                  | HubSpot Memberships authentication                         |
| `data/*.json`                             | HubSpot CRM API (custom modules in HubL templates)         |
| Finance form save toast                   | HubL form posting to private app → CRM property updates    |
| Stock card grid from `stock.json`         | HubL custom module rendering Property Stock custom object  |
| Activity feed from `activity.json`        | HubSpot Engagements API filtered by deal associations      |
| Hardcoded firm-level filter               | HubSpot Membership group → record permission filter        |
| File upload simulation                    | HubSpot File Manager + form upload field                   |
