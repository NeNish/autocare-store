# AutoCare: handover and launch guide

This guide is for the business that will run the store. It covers the accounts to own, the settings to fill in, how to start taking payments, and how to run the shop day to day.

> The policy pages ship with general wording. Have the owner (and ideally a lawyer) review them before launch.

---

## 1. What the business gets

| Part | Where it runs | Address |
|---|---|---|
| Website (Next.js) | Vercel project **client** | e.g. `https://client-theta-lemon.vercel.app` or your own domain |
| API (Node + Express) | Vercel project **autocare-store-server** | `https://autocare-store-server.vercel.app` |
| Database | MongoDB Atlas | cluster connection string in `MONGODB_URI` |
| Payments | Razorpay | dashboard.razorpay.com |
| Code | GitHub | `NeNish/autocare-store` |

### Ways the store makes money
- **Product sales** paid online through Razorpay (UPI, cards, net banking, wallets).
- **Care kits**: bundles priced below the parts bought separately. The kit page shows the saving, worked out from today's prices. One example kit (Monsoon Clear-View Kit, ₹899) is created by the seed; change its price or hide it in Admin → Products.
- **Promo codes**: percentage or fixed amount, with a minimum order, a cap, dates, a usage limit and once-per-customer.
- **Delivery fee with a free-delivery threshold** (default ₹79, free from ₹999), editable in Admin → Store settings. This nudges larger baskets.
- **Blade replacement reminders**: shoppers opt in at checkout and get one email after a set number of months (default 6), which brings them back for repeat sales.

---

## 2. Transfer ownership (do this first)

1. **GitHub**: transfer the repository to the business's account (Settings → Transfer), or add them as an owner.
2. **Vercel**: invite the business to the team, or have them import the repository into their own Vercel account and recreate the two projects (Root Directory `client` and `server`), copying every environment variable.
3. **MongoDB Atlas**: add the business as Project Owner, or create a new cluster in their account and update `MONGODB_URI`.
   - **Network Access must include `0.0.0.0/0`.** Vercel servers have no fixed IP address, and the site cannot load products without this.
   - If the free cluster is **Paused**, click **Resume**.
4. **Razorpay** must be the business's own account, because payouts go to its bank account. See section 4.
5. Change the admin password: create a fresh admin with `ADMIN_EMAIL` / `ADMIN_PASSWORD` and `npm run seed`, then sign in.

---

## 3. Fill in the business details (website project)

In Vercel → **client** → Settings → Environment Variables, set the following, then redeploy:

| Variable | Example | Used on |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.autocare.in` | sitemap, links in search results |
| `NEXT_PUBLIC_BUSINESS_NAME` | `AutoCare` | footer, product data |
| `NEXT_PUBLIC_LEGAL_NAME` | registered business name | terms, contact, footer |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `support@…` | contact, policies |
| `NEXT_PUBLIC_SUPPORT_PHONE` | `+91 …` | contact |
| `NEXT_PUBLIC_SUPPORT_HOURS` | `Mon–Sat, 10am–6pm IST` | contact |
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | registered address | terms, contact |
| `NEXT_PUBLIC_GSTIN` | if registered | terms, contact |
| `NEXT_PUBLIC_DISPATCH_DAYS` | `1–2` | shipping policy |
| `NEXT_PUBLIC_DELIVERY_DAYS` | `3–7` | shipping policy |
| `NEXT_PUBLIC_RETURN_DAYS` | `7` | refund policy |
| `NEXT_PUBLIC_JURISDICTION` | city for disputes | terms |

Any value left empty appears as a highlighted **[to be added]** on the policy and contact pages, so nothing is invented. Razorpay checks these pages when it activates an account, so complete them first.

---

## 4. Start taking payments (Razorpay)

1. Create or sign in to the business's Razorpay account and complete **KYC / activation**. You will need the website address and the policy pages (`/policies/terms`, `/policies/privacy`, `/policies/refunds`, `/policies/shipping`, `/contact`).
2. **Test mode first.** Go to Dashboard → Account & Settings → API Keys and generate **Test** keys.
3. In Vercel → **autocare-store-server** → Environment Variables, add:
   - `RAZORPAY_KEY_ID`: the `rzp_test_…` key
   - `RAZORPAY_KEY_SECRET`: its secret
   - `STORE_NAME`: the name shown in the payment window
4. **Webhook** (Razorpay → Account & Settings → Webhooks → Add):
   - URL: `https://<your-api>/api/payments/razorpay/webhook`
   - Events: `payment.captured`, `payment.failed`, `order.paid`
   - Choose a secret, then put the same value in `RAZORPAY_WEBHOOK_SECRET`.

   The webhook confirms payments even if a shopper closes the tab right after paying.
5. Redeploy the API. **Admin → Store settings → Launch checklist** should show Razorpay payments and the webhook as **on**.
6. **Test an order** with Razorpay's test UPI ID or test card (listed in Razorpay's docs), then cancel it and confirm the refund.
7. **Go live.** Generate **Live** keys, replace the test keys and webhook secret, and redeploy.

### How payment works
- At checkout the server prices the order itself and holds the stock. It then opens a Razorpay order for the exact amount.
- After the shopper pays, the server checks Razorpay's signature, fetches the payment from Razorpay, confirms the amount and captures it. Only then is the order marked **Paid**.
- An unpaid order keeps its stock for `PAYMENT_WINDOW_MIN` (default 30 minutes), then releases it. If a payment arrives late, the order is restored if stock allows; otherwise it is refunded automatically.
- Cancelling a paid order (by the customer before packing, or by an admin at any time) refunds the full amount through Razorpay automatically.

---

## 5. Daily job and reminder emails (optional)

- `server/vercel.json` schedules `/api/cron/daily` once a day (08:47 IST). It releases expired unpaid orders and sends any due reminders.
- Set `CRON_SECRET` on the API project (any long random text). Vercel sends it automatically.
- To email reminders automatically, create a free [Resend](https://resend.com) account, verify the sending domain, and set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `AutoCare <reminders@autocare.in>`).
- Without email, use **Admin → Reminders**: export the due list as CSV, contact customers, then click **Mark sent**.

---

## 6. Running the shop (admin panel at `/admin`)

| Tab | Use it to |
|---|---|
| Orders | See payment status (Paid / Refunded / Unpaid), the promo used, revenue and average order value. Move orders Paid → Packing → Shipped → Delivered. Cancelling a paid order refunds it. |
| Products | Add or edit products, prices, stock and photo URLs; set blade lengths and connectors for wiper blades; build **Kits** (type "Kit" → choose contents). |
| Promo codes | Create codes for launches, festivals or win-backs. |
| Reminders | Due and upcoming blade reminders; CSV export. |
| Vehicle fitments | Add verified wiper sizes per vehicle; a source is required for each. |
| Categories | Manage categories. |
| Store settings | Delivery fee, free-delivery threshold, reminder months; launch checklist. |

---

## 7. Launch checklist

- [ ] Atlas network access `0.0.0.0/0`, cluster running
- [ ] `npm run seed` run once against the live database (adds blade sizes and the starter kit; keeps prices, stock, users and orders)
- [ ] Admin password changed
- [ ] Business details set (section 3) and policy pages reviewed
- [ ] Razorpay test order paid and refunded successfully
- [ ] Razorpay live keys and webhook set
- [ ] `CRON_SECRET` set (and Resend, if wanted)
- [ ] Own domain added in Vercel → client → Domains, and `NEXT_PUBLIC_SITE_URL` updated
- [ ] Real product photos added (Admin → Products → Image URL)
- [ ] Kit price and delivery fee confirmed by the owner
- [ ] Optional: `ANTHROPIC_API_KEY` for AI answers in the care assistant
