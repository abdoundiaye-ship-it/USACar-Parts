# USA PARTS AUTO ERP — North Star

> This document answers three questions: **Where are we going? Why does it matter? How will we know we've arrived?**
> It is the single source of truth for every product decision. When in doubt, refer here.

---

## The Problem We Solve

USA PARTS AUTO imports premium American motor oils and automotive fluids and resells them in Senegal. The business runs on a Google Sheets workbook today. That works — until it doesn't:

- **Stock accuracy degrades** when the sheet is edited by multiple people or on a bad connection.
- **Landed cost is manual arithmetic** — one wrong cell formula misprices the entire shipment.
- **Invoice generation is copy-paste** — slow, error-prone, not client-facing professional.
- **There is no single source of truth.** The business owner has to mentally reconcile five different tabs to answer "are we profitable this month?"

The ERP fixes all of this.

---

## Vision

> **Become the operating system of the Senegalese auto parts distribution business** — from the moment goods leave a warehouse in the United States to the moment cash is collected in Dakar.

In five years, a USA PARTS AUTO employee should be able to:
- Open a sales order on their phone in 30 seconds
- Know the exact landed cost and suggested price of any SKU on the shelf
- Send a professional invoice by WhatsApp before the customer leaves the counter
- See the month's gross margin before the end-of-day prayer

---

## Mission (v1 Scope)

> **Give a one-person operation the financial visibility of a 10-person company — without requiring IT infrastructure or technical expertise.**

Everything in v1 runs in a browser. No server. No database administrator. No subscription. If you can open a file, you can run this ERP.

---

## Core Principles

These are not aspirations. They are constraints that apply to every feature decision.

### 1. Offline First
The internet in Dakar is unreliable. The application must work **completely offline**. Cloud sync is a Phase 4 enhancement, not a requirement. If a feature requires connectivity to function, it ships as optional — it never blocks core workflows.

### 2. French, Always
Every label, error message, tooltip, and document is in French. No mixed-language UI. No untranslated technical terms. The user should never need to guess what a field means.

### 3. The Landed Cost is Sacred
The most important number in this business is not the sale price — it is the **true cost of one unit on the shelf in Dakar**, including transport and customs. Every pricing decision flows from it. The ERP must make this number impossible to get wrong.

### 4. One Source of Truth
There is exactly one place to look for each piece of information. Stock is always computed from the movement journal — never stored as a raw count. Prices are always read from the price list — never hardcoded in a sale line. Facts that exist in two places will eventually contradict each other.

### 5. Respect the User's Time
The most frequent operations (record a sale, check stock, print an invoice) must complete in under three taps or clicks. Power features (reports, settings, backup) can be deeper in the UI. Never optimize for rare operations at the expense of daily ones.

### 6. Transparent Data
The user must always be able to export their own data as CSV or JSON and take it elsewhere. No lock-in. The backup feature is a first-class feature, not an afterthought.

---

## Success Metrics

These are the numbers we track to know whether the product is working.

### Operational Health (Daily)
| Metric | Target | How to Measure |
|---|---|---|
| Stock accuracy | ≥ 98% | Physical count vs. ERP count at monthly inventory |
| Invoice turnaround | < 2 min from sale to printed invoice | Time a typical sale flow |
| Unrecorded sales | 0 | Cross-check cash register vs. ERP sales |

### Financial Clarity (Monthly)
| Metric | Target | How to Measure |
|---|---|---|
| Gross margin visibility | Owner can state GM% within 10 seconds | Ask without opening a calculator |
| Unpaid invoice tracking | 0 invoices > 30 days unpaid undetected | Factures Impayées dashboard |
| Stock valuation accuracy | ≤ 2% variance from physical count | Monthly inventory audit |

### Business Performance (Quarterly)
| Metric | Target | How to Measure |
|---|---|---|
| Top-selling SKUs known | Owner can name top 5 without the app | Dashboard Top 5 chart |
| Landed cost error rate | 0 shipments mispriced | Audit of Achats "Autres Frais" entries |
| Stockout events | ≤ 2 per quarter | Days where stock = 0 for an active SKU |

---

## The Ideal User

### Primary: The Owner-Operator (Admin)
- Runs the business day-to-day
- Reviews margin and stock on a desktop or laptop
- Makes pricing and purchasing decisions
- Needs the dashboard to be meaningful in a single glance
- **Does not want to learn software. Wants the software to learn the business.**

### Secondary: The Counter Salesperson (Vendeur)
- Records sales at the point of service
- Works on a tablet or phone
- Must be fast: a customer is waiting
- Does not need financial analysis — needs product lookup, stock check, sale entry, invoice print
- **The 3-tap rule applies here more than anywhere.**

### Tertiary: The Accountant (Comptable) — Phase 4+
- Reviews monthly financials
- Exports data to external accounting software
- Needs read-only access to everything
- Needs zero ability to accidentally modify historical records

---

## What We Are NOT Building

Clearly defining what is out of scope prevents feature creep from diluting the core.

| Out of Scope | Reason |
|---|---|
| E-commerce / online storefront | Different product, different user, different problem |
| Point-of-sale hardware integration (barcode scanner, receipt printer) | Phase 4+ consideration; adds hardware dependency |
| HR / payroll | Not an automotive parts problem |
| Multi-company / multi-branch | Out of scope until v2.0 is proven stable |
| Real-time competitor price tracking | External data dependency, Phase 5 at earliest |
| Built-in messaging / chat | Use WhatsApp. Don't compete with it. |

---

## Strategic Bets

These are the three decisions where we are deliberately choosing a path that forecloses alternatives. We make them consciously.

### Bet 1: Browser-native is the right v1 stack
We believe the zero-install, zero-server constraint is a feature, not a limitation. It removes all friction from adoption. If we are wrong, we migrate to a hosted backend in v2.0 — but we will have a proven data model and a trained user base.

### Bet 2: French-speaking West Africa is an underserved market for ERP
Existing ERP tools (Odoo, Sage) are expensive, complex, and designed for French or European businesses. A purpose-built, French-language, offline-first tool for Senegalese distribution businesses has a real moat.

### Bet 3: The landed cost formula is the wedge
No spreadsheet and no general-purpose ERP handles the "distribute customs + shipping costs proportionally across a shipment and update each product's floor price automatically" workflow cleanly. This is the feature that makes users switch and stay.

---

## Amendments

| Date | Change | Author |
|---|---|---|
| 2026-04-26 | Initial version | Claude Code + Abdou Ndiaye |
