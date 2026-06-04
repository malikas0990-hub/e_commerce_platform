const express = require('express');
const { fn, col, literal, Op } = require('sequelize');
const { Order, Product, Customer, User } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin or manager
router.use(authenticateToken, authorizeRoles('admin', 'manager'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  const [totalOrders, totalCustomers, totalProducts, pendingOrders] = await Promise.all([
    Order.count(),
    Customer.count(),
    Product.count(),
    Order.count({ where: { status: 'pending' } }),
  ]);

  const revenueRow = await Order.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('totalPrice')), 0), 'revenue']],
    where: { paymentStatus: 'paid' },
    raw: true,
  });

  res.json({
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    totalRevenue: Number(revenueRow.revenue) || 0,
  });
});

// Sales trend (last 7 days)
router.get('/analytics', async (req, res) => {
  const rows = await Order.findAll({
    attributes: [
      [fn('date_trunc', 'day', col('createdAt')), 'day'],
      [fn('COUNT', col('id')), 'orders'],
      [fn('COALESCE', fn('SUM', col('totalPrice')), 0), 'sales'],
    ],
    where: { createdAt: { [Op.gte]: literal("NOW() - INTERVAL '7 days'") } },
    group: [literal('day')],
    order: [literal('day ASC')],
    raw: true,
  });

  const salesByCategory = await Product.findAll({
    attributes: ['category', [fn('COUNT', col('id')), 'count']],
    group: ['category'],
    raw: true,
  });

  res.json({
    trend: rows.map((r) => ({
      date: new Date(r.day).toISOString().slice(0, 10),
      orders: Number(r.orders),
      sales: Number(r.sales),
    })),
    categories: salesByCategory.map((c) => ({ category: c.category, count: Number(c.count) })),
  });
});

// Recent orders with customer info
router.get('/orders', async (req, res) => {
  const orders = await Order.findAll({
    include: [{ model: User, attributes: ['name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  res.json(
    orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.User ? o.User.name : '—',
      totalPrice: Number(o.totalPrice),
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    }))
  );
});

// Customer list (CRM)
router.get('/customers', async (req, res) => {
  const customers = await Customer.findAll({
    include: [{ model: User, attributes: ['name', 'email'] }],
    order: [['totalSpent', 'DESC']],
  });
  res.json(customers);
});

module.exports = router;
