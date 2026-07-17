# Zaxia Healthcare — Phased Build Plan

I'll build this in three phases, shipping Phase 1 first and confirming before moving on. This keeps each phase reviewable and avoids a giant single delivery.

## Design System (applied globally)

- Palette: deep clinical blue primary (`oklch(~0.42 0.13 250)`), soft sky accent, near-white surfaces, slate ink text. Success green, subtle destructive red. All defined as semantic tokens in `src/styles.css`.
- Typography: Inter (body) + Fraunces or Space Grotesk (headings) via Google Fonts `<link>` in `__root.tsx`.
- Generous whitespace, 1.25rem base radius, soft elevation shadows, subtle gradient tokens.
- Reusable primitives: `Section`, `Container`, `SectionHeading`, custom Button variants (`hero`, `outline-brand`).

## Phase 1 — Marketing Site (this turn)

Backend: **Lovable Cloud enabled now** so the product schema is real from day one (drives Phase 2/3 without a rewrite).

Routes (TanStack file-based):
- `/` — Hero (tagline + dual CTA), About snippet, Key Products grid (top 6 from DB), Why-Choose-Us, Contact CTA band.
- `/about` — Mission, 10+ yrs history, team/expertise, values.
- `/products` — Grid pulled from `products` table with category filter chips + search.
- `/contact` — Form (name/email/phone/message, Zod validated) → writes to `inquiries` table + shows office address, phones, email, map embed.
- Shared header (logo, nav, cart placeholder slot ready for Phase 3) + footer.

Data (migration in same turn):
- `categories(id, slug, name)`
- `products(id, slug, name, description, category_id, price_inr, image_url, in_stock, featured, created_at)` — seeded with the capsules/tablets/syrups/injections from the uploaded doc.
- `blog_posts(id, slug, title, excerpt, content, image_url, published_at, created_at)` — schema ready, empty.
- `inquiries(id, name, email, phone, message, created_at)`
- RLS: public SELECT on products/categories/blog_posts (published only); public INSERT on inquiries; admin-only writes elsewhere. Proper GRANTs.

SEO: per-route `head()` (title, description, og:\*), `sitemap.xml`, `robots.txt`.

## Phase 2 — Admin Panel (next turn, after Phase 1 approval)

- Email/password auth (Lovable Cloud). `user_roles` table + `has_role()` security definer + `admin` role.
- `/auth` public login. `_authenticated/admin/*` gated subtree with role check.
- Screens: Dashboard (product count, inquiry count, recent inquiries), Products CRUD, Blog CRUD, Inquiries inbox.
- Image uploads via Cloud Storage bucket.

## Phase 3 — E-commerce (later turn)

- Cart in `localStorage` + Zustand, header cart badge.
- `/products/$slug` detail page with Add to Cart / Buy Now.
- `/cart`, `/checkout` (shipping form → `orders` + `order_items` tables).
- Payment provider left as a follow-up (Stripe/Paddle) — schema ready.

## Technical Notes

- All product/blog reads go through server functions using the publishable-key server client (public data, RLS-scoped) so Phase 2 admin writes and Phase 3 cart plug in without refactoring.
- Cart abstraction added in Phase 1 as a no-op context so Phase 3 only swaps the implementation.
- No hardcoded colors in components — everything through tokens/variants.

---

Approve to proceed with **Phase 1 only** (marketing site + full DB schema + Cloud enabled). I'll ping you when it's ready for review before starting Phase 2.
