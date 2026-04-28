# AllianceCorp Broker Portal — Clickable Mockup Brief

**Purpose:** A clickable HTML mockup of an external broker portal, built to demo what a HubSpot Content Hub + Private Content (Memberships) implementation would look like for AllianceCorp's external broker channel. Used in the Section 3 segment of the AllianceCorp executive demo.

**Audience for the mockup:** AllianceCorp execs (CEO, COO, Head of FinAlliance) — they need to see *what their external brokers will experience*, not the underlying tech.

---

## 1. Context

AllianceCorp has ~12 external mortgage brokers plus an internal FinAlliance team that operate today inside a Salesforce partner community bolted onto the main org. Brokers manually duplicate finance data across the Master Opp and Settlement Opp, and external brokers have no real visibility into deal status.

The target state is a **gated portal built on HubSpot Content Hub Professional with Private Content (Memberships)**, accessed from `brokers.alliancecorp.com.au` (or similar). Brokers log in, see only the deals assigned to them (or their firm), and can update finance fields directly on the Master Opp deal.

This mockup is **not production code**. It's a high-fidelity, clickable HTML prototype to make the SOW conversation concrete and to let execs picture the broker experience.

---

## 2. Style Guide — Extract from Live Site

**Source:** https://www.alliancecorp.com.au/

**Before building anything, extract the actual brand tokens from the live site.** Do not guess. Use Playwright, curl + CSS parsing, or visit the page and pull:

- Primary brand colour(s) (hero, buttons, CTAs)
- Secondary / accent colour(s)
- Neutral palette (backgrounds, body text, borders)
- Font family / families (heading + body)
- Heading case convention (the live site uses ALL CAPS for major headings — replicate this)
- Button style (shape, hover, border radius)
- Logo (download from `/wp-content/uploads/2023/05/cropped-AC-WEBSITE-WIREFRAME-1.png` or the live header)

Build a small `tokens.css` (or Tailwind config) file from those values and reference it everywhere. Document what was extracted in a comment at the top of the file.

**Tone:** premium, established, family-business-confident. The live site reads as trusted-advisor, not flashy fintech. Match that — generous white space, serif or strong sans heading, conservative colour use.

---

## 3. Pages & Click Flow

Six pages, all linked. Use a single-page app or static multi-page — your call. Hash routes are fine.

### 3.1 Login Page (`/login`)
- AllianceCorp logo top-left, plain centred login card
- Email + password fields, "Forgot password?" link, "Sign in" button
- Footer note: "Powered by HubSpot Content Hub" (small, grey — this is for the demo audience)
- Submitting any credentials → redirect to Dashboard

### 3.2 Dashboard (`/dashboard`)
The broker's home view after login. Should feel like a clean broker workspace, not a CRM.

**Header (persistent across all logged-in pages):**
- AllianceCorp logo left
- Nav: Dashboard | My Deals | Stock Pipeline | Resources
- Top right: broker name, avatar, dropdown with Profile / Logout
- **View toggle** (key feature to demo): "My Deals" / "Firm View — [Firm Name]" — toggle switches the data shown on Dashboard and My Deals pages

**Body:**
- Welcome strip: "Good morning, [Broker Name]"
- 4 KPI tiles: Active Deals | Pending Finance | Settled This Quarter | Commission YTD
- "Deals Needing Your Attention" — list of 3–5 deals with status chips (Awaiting Pre-Approval, Awaiting Valuation, Awaiting Final Approval, Settlement Imminent)
- "Recent Activity" feed — recent updates across deals (e.g. "Property allocated to John & Sarah Smith deal — 2 hrs ago")

### 3.3 My Deals (`/deals`)
A filterable table of the broker's deals.

**Columns:** Client | Master Opp Stage | Property | Settlement Date | Finance Status | Last Updated | Action
**Filters:** Stage, Finance Status, Settlement Date range, Search by client name
**Toggle behaviour:** "My Deals" shows only deals assigned to the logged-in broker. "Firm View" shows all deals from their firm (this is the firm-level visibility the data model flagged for permission design — show it on, show it off)

Clicking any row → Deal Detail page.

### 3.4 Deal Detail (`/deals/:id`)
The most important page. This is where the broker actually does work. Tabs across the top:

- **Overview** (default) — client names, property summary, key dates, deal stage progress bar showing Master Opp pipeline stages (PEC → Discovery → Strategy → PWP → EOI → Contracts → Settlement)
- **Finance** — editable form fields the broker updates: Pre-Approval Status, Pre-Approval Amount, Lender, Interest Rate, Final Approval Status, Final Approval Date, Notes. Inline "Save" button. Show a success toast on save.
- **Property** — readonly summary of the allocated Property Stock record (address, type, price, builder, est. settlement)
- **Valuation** — list of associated Valuation records (date, valuer, ordered/completed, amount). "Request New Valuation" button.
- **Documents** — list of files (mock: Pre-Approval Letter.pdf, Contract of Sale.pdf, Valuation Report.pdf), with upload area
- **Activity** — chronological feed of every update on the deal

The Finance tab is the hero of the demo — show clean form fields, helpful inline labels, and the "writes back to HubSpot" feel without faking the API.

### 3.5 Stock Pipeline (`/stock`)
A read-only view of upcoming property stock the broker can position with their clients. Card grid of 6–8 properties:
- Suburb, state, type (House & Land / Townhouse / Apartment)
- Price band, est. completion / settlement
- "Allocated" / "Available" / "Reserved" status chip
- Filter by state, price band, type

This is a "value extension" page — gives external brokers a reason to log in beyond their own deals.

### 3.6 Resources (`/resources`)
Simple gated content library — 4–6 cards: rate sheets, broker guides, AllianceCorp policy docs, market updates. Click → mock PDF download or in-page article.

---

## 4. Mock Data

Create a `mock-data.js` file with realistic seed data. Roughly:

- **1 logged-in broker:** "Marcus Thompson", firm "Thompson Finance Group", 6 active deals
- **8–12 deals** across stages, mix of single applicants, couples, SMSFs
- **6–8 property stock records** across VIC, QLD, NSW, with varied price bands $550k–$1.2M
- **3–4 other brokers in the same firm** (so Firm View shows more deals)
- **Clients:** plausible Australian names, plausible Melbourne / Sydney / Brisbane suburbs

Keep all data in one file so it's easy to edit live during the demo if needed.

---

## 5. Tech Constraints

- **Stack:** vanilla HTML/CSS/JS or React + Vite — pick whichever ships fastest. No backend.
- **Storage:** in-memory only. State resets on refresh — that's fine for a demo.
- **Routing:** hash-based or React Router, single-page app preferred so transitions are instant.
- **Responsive:** must look clean on a 1440px laptop screen (the demo machine). Tablet OK, mobile not required.
- **No real auth:** login button just navigates forward.
- **No real API calls.** All data is local.
- **Accessibility:** sensible only — semantic HTML, focusable inputs, alt text on the logo. Don't go deep.

---

## 6. What "Done" Looks Like

- All 6 pages reachable via the click flow described above
- View toggle (My Deals / Firm View) works and visibly changes the data
- Finance tab form is editable and shows a save confirmation
- Brand tokens extracted from the live AllianceCorp site and applied consistently
- Runs locally with one command (`npm run dev` or `python -m http.server`)
- A short `README.md` that explains: how to run it, what was extracted from the live site, what's mocked, and what a real HubSpot Content Hub build would replace

---

## 7. Out of Scope

- Real HubSpot integration of any kind
- Real authentication / SSO
- Real file uploads
- Mobile-optimised layouts
- Production-grade code quality, testing, build pipelines
- Anything resembling AllianceCorp's actual data — all mock

---

## 8. Demo Notes for the Operator

When showing this in the exec demo:

1. Open on the **Login page** — frame: "This is what your external brokers see. They land on your domain, branded, gated."
2. Sign in → **Dashboard** — frame: "They only see their world. KPIs, their deals, recent activity. No HubSpot UI, no Salesforce community login."
3. Toggle to **Firm View** — frame: "If you choose to enable firm-level visibility, the broker sees every deal from Thompson Finance Group. That's a permission decision we'll make with you in design."
4. Click a deal → **Finance tab** — frame: "This is the magic. They update finance fields here, once, and it writes straight back to the Master Opp in your CRM. No double-entry between Master and Settlement."
5. Show **Stock Pipeline** — frame: "And we extend value to your broker channel — they see what stock is coming so they can position deals proactively."

Keep the whole walkthrough under 4 minutes. Land on the value statement: "Twelve external brokers plugged into your CRM without a partner community licence, without double entry, and on your brand."
