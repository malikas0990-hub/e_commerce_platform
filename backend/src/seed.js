require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Customer, Product } = require('./models');
const logger = require('./utils/logger');

const PRODUCTS = [
  { name: 'Klassik Oq Ko\'ylak', category: 'Ko\'ylak', price: 120000, cost: 70000, stock: 150, sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Blue'], material: 'Paxta', sku: 'SHRT-001', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500' },
  { name: 'Jinsi Shim (Slim)', category: 'Shim', price: 250000, cost: 150000, stock: 80, sizes: ['M', 'L', 'XL'], colors: ['Blue', 'Black'], material: 'Denim', sku: 'JEAN-002', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500' },
  { name: 'Sport Futbolka', category: 'Futbolka', price: 85000, cost: 45000, stock: 300, sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'White', 'Red'], material: 'Polyester', sku: 'TSHRT-003', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500' },
  { name: 'Qishki Kurtka', category: 'Ustki kiyim', price: 650000, cost: 400000, stock: 40, sizes: ['M', 'L', 'XL'], colors: ['Black', 'Green'], material: 'Sintepon', sku: 'JCKT-004', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' },
  { name: 'Trikotaj Sviter', category: 'Sviter', price: 180000, cost: 100000, stock: 120, sizes: ['S', 'M', 'L'], colors: ['Grey', 'Beige'], material: 'Jun', sku: 'SWTR-005', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500' },
  { name: 'Ayollar Ko\'ylagi', category: 'Ko\'ylak', price: 320000, cost: 180000, stock: 60, sizes: ['XS', 'S', 'M', 'L'], colors: ['Red', 'Black'], material: 'Shoyi', sku: 'DRSS-006', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500' },
];

const STAFF = [
  { name: 'Super Admin', email: 'superadmin@shop.uz', password: 'super123', role: 'superadmin' },
  { name: 'Administrator', email: 'admin@shop.uz', password: 'admin123', role: 'admin' },
  { name: 'Menejer', email: 'manager@shop.uz', password: 'manager123', role: 'manager' },
];

async function runSeed() {
  const count = await Product.count();
  if (count > 0) {
    logger.info('Seed: ma\'lumotlar mavjud, o\'tkazib yuborildi');
    return;
  }

  logger.info('Seed: boshlang\'ich ma\'lumotlar yuklanmoqda...');

  // Staff users (CRM roles: superadmin / admin / manager)
  for (const s of STAFF) {
    const hash = await bcrypt.hash(s.password, 10);
    await User.create({ name: s.name, email: s.email, password: hash, role: s.role });
  }

  // Demo wholesale customer
  const custPass = await bcrypt.hash('customer123', 10);
  const cust = await User.create({ name: 'Ulgurji Mijoz', email: 'customer@shop.uz', password: custPass, role: 'customer' });
  await Customer.create({ userId: cust.id, company: 'Bozor Savdo MChJ', phone: '+998901234567', city: 'Toshkent', status: 'active' });

  await Product.bulkCreate(PRODUCTS);
  logger.info('Seed: tayyor ✅');
  logger.info('  superadmin@shop.uz / super123');
  logger.info('  admin@shop.uz / admin123');
  logger.info('  manager@shop.uz / manager123');
  logger.info('  customer@shop.uz / customer123');
}

if (require.main === module) {
  (async () => {
    await sequelize.sync({ alter: true });
    await runSeed();
    await sequelize.close();
    process.exit(0);
  })();
}

module.exports = { runSeed };
