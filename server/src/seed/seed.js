/* Seeds the catalog and an admin account.
 * Usage: npm run seed            (adds missing products; keeps prices, stock, orders and users)
 *        npm run seed -- --fresh (wipes categories and products first)
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { syncCatalogue } = require('./catalogue');
const User = require('../models/User');

async function seed() {
  await connectDB();
  const fresh = process.argv.includes('--fresh');
  if (fresh) {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
    console.log('Cleared categories and products');
  }

  const r = await syncCatalogue();
  console.log(`Catalogue synced: ${r.products} products (${r.newProducts} new), ${r.newKits} new kit(s)`);

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
