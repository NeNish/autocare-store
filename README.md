# AutoCare Store

An online store for **Category 82: Windshield Care & Wiper Blades**: concentrated washer fluid tablets, rain-repellent sprays, waffle-weave drying microfiber towels, and universal hook-type wiper blade pairs.

Built on the team's standard stack:

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4      |
| Backend  | Node.js + Express 5 (REST API)                         |
| Database | MongoDB with Mongoose                                  |

## Features

**Customers**
- Browse, search, filter by category or product type, and sort products
- Product detail pages rendered on the server (SEO-friendly)
- Cart saved in the browser and synced across tabs
- Sign up and log in (JWT in an httpOnly cookie)
- Checkout with address validation (cash on delivery); free shipping from ₹999
- Order history, order details, and cancelling an order while it is still pending
- Responsive layout with a mobile menu

**Admins** (`/admin`)
- Orders: list, filter by status, update status, and see revenue and open-order stats
- Products: create, edit, hide from the store, delete, and see low-stock highlighting
- Categories: create, edit, and delete (blocked while a category still has products)

**Security and correctness**
- Passwords hashed with bcrypt (12 rounds); new accounts are always `customer`, so a user can't sign up as admin
- Role-based authorization on every admin endpoint
- Input validation on every write endpoint (express-validator) and on every client form
- Order prices and totals are calculated on the server from the database; prices sent by the client are ignored
- Stock is reserved atomically per item, with rollback if any item fails, so the store can't oversell
- Cancelling an order (by the customer or an admin) returns its items to stock exactly once
- Helmet security headers, CORS allow-list, rate limiting on login and sign-up, 100 kb JSON body limit
- One central error handler that returns consistent `{ success, message, details }` JSON

## Design

The storefront is art-directed as a luxury house: obsidian and midnight grounds, champagne gold and silver accents, Cormorant Garamond display serif over Geist sans.

- **Opening sequence:** a gold ring draws, a wiper light sweeps, then the curtain lifts. It plays once per browser session, can be skipped with a click or Escape, and is pure CSS so it always completes.
- **Homepage chapters:** a full-screen hero with canvas rain and a 3D glass windshield that tilts with the mouse (the wiper sweeps the drops away), a manifesto that lights up word by word as you scroll, a collection index whose artwork follows the cursor, a pinned four-chapter "Ritual" driven by scroll, the signature piece, and a cinematic footer.
- **Interaction:** magnetic buttons, a custom champagne cursor (desktop only), 3D tilt on product art, parallax depth, scroll reveals and soft page transitions.
- **Motion engine:** one small runtime (`client/src/components/lux/MotionRuntime.js`) drives every effect through data attributes (`data-reveal`, `data-magnetic`, `data-tilt`, `data-parallax`, `data-progress`), so pages stay server-rendered. No animation library is used.
- **Accessibility:** visitors who prefer reduced motion get no opening sequence, cursor, parallax or hidden-until-scrolled content. Focus outlines are visible, decorative layers are hidden from screen readers, and text meets contrast guidelines on the dark grounds.
- **Product art:** fine-line gold illustrations per product line (`ProductArt.js`). Add an image URL to a product in Admin to show a photograph instead.

## Project structure

```
autocare-store/
├── server/                    Express API
│   └── src/
│       ├── config/            env loading + MongoDB connection
│       ├── models/            User, Category, Product, Order
│       ├── controllers/       auth, category, product, order logic
│       ├── routes/            all /api routes in one place
│       ├── middleware/        auth (protect / authorize), validate, error handler
│       ├── validators/        express-validator rule sets
│       ├── utils/             ApiError, slugify
│       ├── seed/seed.js       sample catalog + first admin user
│       ├── app.js             Express app (middleware + routes)
│       └── server.js          entry point
└── client/                    Next.js app
    └── src/
        ├── app/               routes: /, /products, /products/[slug], /cart, /checkout,
        │                      /login, /register, /account/orders, /admin
        ├── components/        reusable UI (ProductCard, Header, admin panels, …)
        ├── context/           AuthContext, CartContext
        └── lib/               API client, formatting helpers
```

## Getting started

**Prerequisites:** Node.js 20+ and MongoDB, either a local install (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env          # set MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
cp client/.env.example client/.env.local    # API_URL defaults to http://localhost:5000

# 3. Seed the catalog and create the admin account
npm run seed

# 4. Run the API (port 5000) and the website (port 3000) together
npm run dev
```

Open http://localhost:3000. Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env` to reach `/admin`.

To generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## How the frontend talks to the API

- **Server Components** (home, shop, product pages) call Express directly using `API_URL`.
- **The browser** calls `/api/*` on the Next.js origin. `next.config.mjs` rewrites those requests to Express, so the auth cookie is first-party and no browser CORS setup is needed.

## API reference

All responses are JSON. Errors look like `{ "success": false, "message": "...", "details": [{ "field", "message" }] }`.

| Method | Endpoint                    | Access   | Notes                                                                   |
| ------ | --------------------------- | -------- | ----------------------------------------------------------------------- |
| GET    | `/api/health`               | Public   |                                                                         |
| POST   | `/api/auth/register`        | Public   | `{ name, email, password }`, rate limited                               |
| POST   | `/api/auth/login`           | Public   | `{ email, password }`, rate limited                                     |
| POST   | `/api/auth/logout`          | Public   | Clears the cookie                                                       |
| GET    | `/api/auth/me`              | Public   | Returns `user` or `null`                                                |
| GET    | `/api/categories`           | Public   | Includes `productCount`                                                 |
| GET    | `/api/categories/:slug`     | Public   |                                                                         |
| POST   | `/api/categories`           | Admin    | `{ name, number?, description? }`                                       |
| PUT    | `/api/categories/:id`       | Admin    |                                                                         |
| DELETE | `/api/categories/:id`       | Admin    | Fails (409) if the category still has products                          |
| GET    | `/api/products`             | Public   | `q, category (slug or id), minPrice, maxPrice, sort, page, limit`; admins can add `all=true` to include hidden products |
| GET    | `/api/products/:idOrSlug`   | Public   |                                                                         |
| POST   | `/api/products`             | Admin    | `{ name, category, price, stock, type?, description?, image?, features?, isActive? }` |
| PUT    | `/api/products/:id`         | Admin    | Partial update                                                          |
| DELETE | `/api/products/:id`         | Admin    |                                                                         |
| POST   | `/api/orders`               | Customer | `{ items: [{ product, quantity }], shippingAddress }`                   |
| GET    | `/api/orders/mine`          | Customer |                                                                         |
| GET    | `/api/orders/:id`           | Owner or admin |                                                                   |
| POST   | `/api/orders/:id/cancel`    | Owner    | Pending orders only; restocks items                                     |
| GET    | `/api/orders`               | Admin    |                                                                         |
| PATCH  | `/api/orders/:id/status`    | Admin    | `{ status }`; setting `cancelled` restocks items                        |

`sort` accepts `newest`, `price_asc`, `price_desc`, or `name`. Prices are in INR.

## Adding more categories

The seed creates category 82 only. Add more from **Admin → Categories**, or add entries to `categories` and `products` in `server/src/seed/seed.js` and run `npm run seed` again. Seeding is an upsert, so existing orders and users are kept. Use `npm run seed -- --fresh` (inside `server/`) to wipe categories and products first.

## Deploying to Vercel

The repo deploys as **two Vercel projects** from the same GitHub repo: one for the API (`server/`) and one for the website (`client/`). The database runs on MongoDB Atlas.

1. **MongoDB Atlas:** create a free cluster and a database user, and under *Network Access* allow `0.0.0.0/0` (Vercel servers don't have fixed IPs). Copy the connection string and add the database name, e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/autocare-store`.
2. **API project:** in Vercel choose *Add New → Project*, import this repo, and set **Root Directory = `server`**. Framework preset: **Express** (Vercel usually detects it automatically). Add environment variables:
   - `MONGODB_URI`: the Atlas connection string
   - `JWT_SECRET`: a long random string
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: the website URL from step 3 (fill in afterwards)

   Deploy, then check `https://<api-project>.vercel.app/api/health`.
3. **Website project:** import the same repo again, set **Root Directory = `client`** (framework: Next.js), and add `API_URL` = the API URL from step 2, with no trailing slash. Deploy.
4. Put the website URL into the API project's `CLIENT_URL` and redeploy the API.
5. **Seed the live database once** from your computer: set `MONGODB_URI`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, then run `npm run seed`.

How it runs on Vercel: Vercel's zero-config Express support uses `server/src/app.js`, which exports the app. The app connects to MongoDB on the first request and reuses the connection while the instance stays warm. If `MONGODB_URI` or `JWT_SECRET` is missing, every `/api` call returns a JSON error naming the missing variable instead of crashing.

## Production notes

- Set `NODE_ENV=production` on the API so cookies are `secure` (HTTPS only) and 500 errors don't leak details.
- Set `CLIENT_URL` to the real frontend origin(s), comma-separated.
- Run `npm run build && npm start` in `client/`, and set `API_URL` to the API's internal URL.
- Payment is cash on delivery. To take online payments, add a gateway such as Razorpay or Stripe in `orderController.create`.
