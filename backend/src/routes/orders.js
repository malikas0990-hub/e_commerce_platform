const express = require('express');
const { sequelize, Order, Product, Customer } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getIO } = require('../socket');
const { cacheInvalidate } = require('../config/redis');

const router = express.Router();

// Create order — checks stock in a transaction (business logic / WMS check)
router.post('/', authenticateToken, async (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Buyurtma tarkibi bo\'sh' });
  }

  const order = await sequelize.transaction(async (t) => {
    let totalPrice = 0;
    const detailedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product) throw Object.assign(new Error(`Mahsulot topilmadi: ${item.productId}`), { status: 400 });
      if (product.stock < item.quantity) {
        throw Object.assign(new Error(`"${product.name}" omborda yetarli emas (qoldiq: ${product.stock})`), { status: 400 });
      }
      product.stock -= item.quantity;
      await product.save({ transaction: t });
      totalPrice += Number(product.price) * item.quantity;
      detailedItems.push({ productId: product.id, name: product.name, price: Number(product.price), quantity: item.quantity });
    }

    const created = await Order.create({
      userId: req.user.id,
      orderNumber: `ORD-${Date.now()}`,
      items: detailedItems,
      totalPrice,
      shippingAddress: shippingAddress || {},
      status: 'pending',
    }, { transaction: t });

    // CRM: bump customer status / lifetime value
    const customer = await Customer.findOne({ where: { userId: req.user.id }, transaction: t });
    if (customer) {
      const newTotal = Number(customer.totalSpent) + totalPrice;
      await customer.update(
        { totalSpent: newTotal, status: newTotal > 5000000 ? 'vip' : 'active' },
        { transaction: t }
      );
    }
    return created;
  });

  await cacheInvalidate('cache:/api/products*');
  getIO().emit('order:new', { id: order.id, orderNumber: order.orderNumber, totalPrice: order.totalPrice });
  res.status(201).json(order);
});

// Current customer's orders
router.get('/my', authenticateToken, async (req, res) => {
  const orders = await Order.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
  res.json(orders);
});

// Update status (admin/manager)
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  await order.update({ status });
  getIO().emit('order:updated', { id: order.id, status });
  res.json(order);
});

module.exports = router;
