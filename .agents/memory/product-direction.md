---
name: Product direction
description: Durable product/business decisions for Art de Sucre (PastryPro) recipe app
---

# Art de Sucre (PastryPro) — product direction

The app is being sold commercially to Polish patisserie / commercial-kitchen
clients as **yearly per-user access** (~500 zł). The business model relies on the
existing per-user data isolation + admin user management: the admin creates an
account per paying buyer.

**Why:** owner sells access; there is no self-serve billing, so admin-created
accounts are the delivery mechanism.

**How to apply:**
- All user-facing UI must be in **Polish** and use **PLN** (not `$`). Treat any
  remaining English label or `$` sign as a bug.
- Owner communicates in Polish — respond in simple Polish.
- Keep the premium "Art de Sucre" visual identity (cream palette, dark sidebar
  with gold accents, Playfair Display headings). Don't reintroduce the old
  generic green/purple styling.
- Don't ship non-functional UI (e.g. settings toggles that only write
  localStorage and do nothing) — it reads as unfinished for a paid product.
