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
- **Weather simulator** (`/simulator`): a real-time windshield with rain, fog, day/dusk/night light, wiper speeds, worn blades and rain repellent, plus a live clarity reading
- **Compatibility finder** (`/fit`): match by verified vehicle record (make → model → year) or by measuring your current blades; results show exact and close (within 1″) matches and check the arm connector
- **Compare** up to three products side by side (`/compare`)
- **Interactive 3D product views** (three.js) on product pages and in the homepage chapters
- **Windshield care assistant**: troubleshooting, maintenance and product suggestions grounded in the live catalogue; uses Claude when `ANTHROPIC_API_KEY` is set and a built-in care guide otherwise

**Admins** (`/admin`)
- Orders: list, filter by status, update status, and see revenue and open-order stats
- Products: create, edit, hide from the store, delete, and see low-stock highlighting
- Categories: create, edit, and delete (blocked while a category still has products)
- Vehicle fitments: add, edit and delete vehicle wiper-size records; every record requires a verification source
- Products: blade lengths (inches) and arm connectors for wiper blades, used by the compatibility finder

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

The storefront is designed as the cockpit of a next-generation vehicle: obsidian black, metallic silver, electric blue and icy white, set in Geist and Geist Mono.

- **Opening sequence:** a short "system check" (rain sensor, wiper system, glass surface, washer circuit). It plays once per browser session and is pure CSS.
- **Windshield engine** (`client/src/lib/windshield-sim.js`): a canvas simulation of rain on glass with a water film, refracting droplets, wiper sweeps that clear the glass, streaks from worn blades, beading and run-off with repellent, and fog. It pauses when off screen and renders a still frame for reduced motion. The hero and the simulator both use it.
- **Homepage story:** full-screen windshield hero with a live HUD, a statement that lights up as you scroll, a pinned four-chapter "Anatomy of clarity" with 3D models, the simulator, the fit finder, the product range and the assistant.
- **Motion runtime** (`client/src/components/lux/MotionRuntime.js`) drives reveals, magnetic buttons, tilt, parallax and scroll progress through data attributes, so pages stay server-rendered.
- **Accessibility:** reduced-motion support throughout, keyboard-operable controls, visible focus, labelled 3D views and live regions for results.

### No invented data

- No vehicle fitment data ships with the app. The vehicle search only lists records an admin has added with a cited source; until then it points customers to measuring their blades.
- Matching uses only the blade lengths and connectors recorded on each product.
- Spec tables and comparisons show only stored product data. 3D models and the simulator's clarity reading are labelled illustrative.
- The assistant answers from the catalogue and general care guidance and never claims a part fits a specific vehicle.

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
| GET    | `/api/fitments/makes`       | Public   | Makes with verified records                                             |
| GET    | `/api/fitments/models`      | Public   | `make`                                                                  |
| GET    | `/api/fitments/years`       | Public   | `make, model`                                                           |
| GET    | `/api/fitments/lookup`      | Public   | `make, model, year`; returns the record(s) and matching blade pairs     |
| GET    | `/api/fitments/match`       | Public   | `driver, passenger` (inches), `connector?`                              |
| GET/POST/PUT/DELETE | `/api/fitments[/:id]` | Admin | Manage records; `source` is required                               |
| POST   | `/api/assistant`            | Public   | `{ messages: [{ role, content }] }`, rate limited (12/min)              |

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
   - `ANTHROPIC_API_KEY` (optional): turns on Claude for the care assistant; `ASSISTANT_MODEL` defaults to `claude-haiku-5-5`

   Deploy, then check `https://<api-project>.vercel.app/api/health`.
3. **Website project:** import the same repo again, set **Root Directory = `client`** (framework: Next.js), and add `API_URL` = the API URL from step 2, with no trailing slash. Deploy.
4. Put the website URL into the API project's `CLIENT_URL` and redeploy the API.
5. **Seed the live database once** from your computer: set `MONGODB_URI`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, then run `npm run seed`. Running it again later updates the catalogue products (including blade sizes for the fit finder) without touching users or orders; note that it also resets their prices and stock to the seed values.

How it runs on Vercel: Vercel's zero-config Express support uses `server/src/app.js`, which exports the app. The app connects to MongoDB on the first request and reuses the connection while the instance stays warm. If `MONGODB_URI` or `JWT_SECRET` is missing, every `/api` call returns a JSON error naming the missing variable instead of crashing.

## Production notes

- Set `NODE_ENV=production` on the API so cookies are `secure` (HTTPS only) and 500 errors don't leak details.
- Set `CLIENT_URL` to the real frontend origin(s), comma-separated.
- Run `npm run build && npm start` in `client/`, and set `API_URL` to the API's internal URL.
- Payment is cash on delivery. To take online payments, add a gateway such as Razorpay or Stripe in `orderController.create`.
