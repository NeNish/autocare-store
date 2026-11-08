/* Seeds the catalog and an admin account.
 * Usage: npm run seed            (adds missing products; keeps prices, stock, orders and users)
 *        npm run seed -- --fresh (wipes categories and products first)
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

const categories = [
  {
    number: 82,
    name: 'Windshield Care & Wiper Blades',
    description:
      'Concentrated washer fluid tablets, rain-repellent sprays, waffle-weave drying microfiber towels, and universal hook-type wiper blade pairs.',
  },
];

const products = [
  {
    name: 'Concentrated Washer Fluid Tablets (Pack of 10)',
    type: 'Washer Fluid',
    price: 249,
    stock: 120,
    description:
      'Effervescent tablets that dissolve in water to make streak-free windshield washer fluid. One tablet makes 4 litres.',
    features: ['1 tablet = 4 L of washer fluid', 'Streak-free, safe on paint and rubber', 'Compact, no bulky bottles'],
  },
  {
    name: 'Concentrated Washer Fluid Tablets (Pack of 30)',
    type: 'Washer Fluid',
    price: 599,
    stock: 80,
    description: 'Value pack of effervescent washer fluid tablets for a full year of clean glass.',
    features: ['1 tablet = 4 L of washer fluid', 'Lemon-fresh scent', 'Best value per litre'],
  },
  {
    name: 'Rain-Repellent Glass Spray 200 ml',
    type: 'Rain Repellent',
    price: 399,
    stock: 90,
    description:
      'Hydrophobic coating that makes rain bead and roll off the windshield at speed, improving visibility in monsoon driving.',
    features: ['Lasts up to 3 months', 'Reduces wiper use above 60 km/h', 'Also works on side mirrors'],
  },
  {
    name: 'Rain-Repellent Glass Spray Twin Pack',
    type: 'Rain Repellent',
    price: 699,
    stock: 50,
    description: 'Two 200 ml cans of rain-repellent spray with an applicator pad.',
    features: ['2 × 200 ml', 'Applicator pad included', 'Safe on tinted glass'],
  },
  {
    name: 'Waffle-Weave Microfiber Drying Towel (60 × 80 cm)',
    type: 'Microfiber Towel',
    price: 349,
    stock: 150,
    description:
      'Lint-free waffle-weave towel that soaks up water fast and leaves glass and paint spot-free.',
    features: ['400 GSM waffle weave', 'Lint and scratch free', 'Machine washable'],
  },
  {
    name: 'Waffle-Weave Microfiber Towels (Set of 3)',
    type: 'Microfiber Towel',
    price: 799,
    stock: 70,
    description: 'Three waffle-weave microfiber drying towels for glass, paint and interiors.',
    features: ['3 × 40 × 40 cm', 'Colour coded for glass, paint, interior', 'Machine washable'],
  },
  {
    name: 'Universal Hook-Type Wiper Blade Pair 16" + 22"',
    type: 'Wiper Blades',
    price: 549,
    stock: 60,
    description:
      'Frameless beam blades with a universal hook adapter. Fits most hatchbacks and compact sedans.',
    features: ['Fits J-hook / U-hook arms', 'Natural rubber with graphite coating', 'Quiet, streak-free wipe'],
    bladeLengthsIn: [16, 22],
    connectors: ['J-hook', 'U-hook'],
  },
  {
    name: 'Universal Hook-Type Wiper Blade Pair 18" + 24"',
    type: 'Wiper Blades',
    price: 649,
    stock: 45,
    description: 'Frameless beam blade pair for sedans and compact SUVs with hook-type wiper arms.',
    features: ['Fits J-hook / U-hook arms', 'UV and ozone resistant rubber', 'Tool-free install'],
    bladeLengthsIn: [18, 24],
    connectors: ['J-hook', 'U-hook'],
  },
  {
    name: 'Universal Hook-Type Wiper Blade Pair 20" + 26"',
    type: 'Wiper Blades',
    price: 749,
    stock: 35,
    description: 'Frameless beam blade pair for SUVs and MPVs with hook-type wiper arms.',
    features: ['Fits J-hook / U-hook arms', 'All-weather spoiler design', 'Tool-free install'],
    bladeLengthsIn: [20, 26],
    connectors: ['J-hook', 'U-hook'],
  },
];

const starterKits = [
  {
    name: 'Monsoon Clear-View Kit',
    type: 'Kit',
    price: 899,
    stock: 30,
    description:
      'Everything for clear glass in the rains, packed together: rain-repellent spray, washer fluid tablets and a waffle-weave drying towel.',
    features: ['Rain-Repellent Glass Spray 200 ml', 'Washer Fluid Tablets (Pack of 10)', 'Waffle-Weave Drying Towel 60 × 80 cm'],
    contents: [
      ['Rain-Repellent Glass Spray 200 ml', 1],
      ['Concentrated Washer Fluid Tablets (Pack of 10)', 1],
      ['Waffle-Weave Microfiber Drying Towel (60 × 80 cm)', 1],
    ],
  },
];

async function seed() {
  await connectDB();
  const fresh = process.argv.includes('--fresh');
  if (fresh) {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
    console.log('Cleared categories and products');
  }

  const catDocs = {};
  for (const c of categories) {
    let doc = await Category.findOne({ name: c.name });
    if (!doc) doc = new Category(c);
    else Object.assign(doc, c);
    await doc.save();
    catDocs[c.number] = doc;
  }

  // New products are created in full. Existing products only get their descriptive fields
  // refreshed, so prices, stock, photos and visibility set in the admin panel are kept.
  const byName = {};
  for (const p of products) {
    let doc = await Product.findOne({ name: p.name });
    if (!doc) doc = new Product({ ...p, category: catDocs[82]._id });
    else {
      const { price: _price, stock: _stock, ...descriptive } = p;
      Object.assign(doc, { ...descriptive, category: catDocs[82]._id });
    }
    await doc.save();
    byName[p.name] = doc;
  }

  // Starter kit, created once (an example bundle; edit or hide it in Admin → Products)
  let kits = 0;
  for (const k of starterKits) {
    if (await Product.exists({ name: k.name })) continue;
    await Product.create({
      ...k,
      category: catDocs[82]._id,
      kitItems: k.contents.map(([name, quantity]) => ({ product: byName[name]._id, quantity })),
    });
    kits += 1;
  }
  console.log(`Seeded ${categories.length} category, ${products.length} products and ${kits} new kit(s)`);

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({ name: 'Store Admin', email: adminEmail, password: adminPassword, role: 'admin' });
      console.log(`Created admin ${adminEmail}`);
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log(`Promoted ${adminEmail} to admin`);
    }
  } else {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set; skipped admin creation');
  }

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
