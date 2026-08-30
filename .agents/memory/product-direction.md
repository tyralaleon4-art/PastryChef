---
name: Product direction
description: Durable product and account-isolation decisions for the Pastry Pro recipe app
---

# Pastry Pro — product direction

The app is being sold commercially to Polish patisserie / commercial-kitchen
clients as **yearly per-user access** (~500 zł). The business model relies on the
existing per-user data isolation + admin user management: the admin creates an
account per paying buyer.

**Why:** owner sells access; there is no self-serve billing, so admin-created
accounts are the delivery mechanism.

**How to apply:**
- The product name is **Pastry Pro**, attributed as **by Leon Tyrała**.
- Each account chooses **Polish or English** in its profile, with Polish as the
  default. Never mix interface languages; user-entered content is not translated.
- Currency remains **PLN** in both language versions.
- Ingredients and ingredient categories belong to one user. Keep all related
  recipe, inventory, and production-plan access isolated to that same account.
- Owner communicates in Polish — respond in simple Polish.
- Keep the premium visual identity (cream palette, dark sidebar
  with gold accents, Playfair Display headings). Don't reintroduce the old
  generic green/purple styling.
- Don't ship non-functional UI (e.g. settings toggles that only write
  localStorage and do nothing) — it reads as unfinished for a paid product.
