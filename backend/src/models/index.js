const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/* ===================== USER ===================== */
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('superadmin', 'admin', 'manager', 'customer'), defaultValue: 'customer' },
}, { tableName: 'users', timestamps: true });

/* ===================== CUSTOMER (CRM) ===================== */
const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('lead', 'active', 'vip', 'blocked'), defaultValue: 'lead' },
  totalSpent: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
}, { tableName: 'customers', timestamps: true });

/* ===================== PRODUCT ===================== */
const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
  category: { type: DataTypes.STRING, allowNull: false },
  sizes: { type: DataTypes.JSONB, defaultValue: ['S', 'M', 'L', 'XL'] },
  colors: { type: DataTypes.JSONB, defaultValue: ['Black', 'White'] },
  material: { type: DataTypes.STRING },
  image: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING, allowNull: false, unique: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [{ fields: ['category'] }, { fields: ['name'] }],
});

/* ===================== ORDER ===================== */
const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  items: { type: DataTypes.JSONB, allowNull: false },
  totalPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'), defaultValue: 'pending' },
  paymentStatus: { type: DataTypes.ENUM('unpaid', 'paid', 'refunded'), defaultValue: 'unpaid' },
  shippingAddress: { type: DataTypes.JSONB },
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [{ fields: ['status'] }, { fields: ['createdAt'] }],
});

/* ===================== ASSOCIATIONS ===================== */
User.hasOne(Customer, { foreignKey: 'userId', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Customer, Product, Order };
