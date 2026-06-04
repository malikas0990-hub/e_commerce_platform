const express = require('express');
const { Op } = require('sequelize');
const { Product } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { cacheInvalidate } = require('../config/redis');

const router = express.Router();

// Public: list products with dynamic filters + pagination (cached 60s)
router.get('/', cacheMiddleware(60), async (req, res) => {
  const { category, minPrice, maxPrice, search, size, color, page = 1, limit = 20 } = req.query;
  const where = { isActive: true };

  if (category) where.category = category;
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = Number(minPrice);
    if (maxPrice) where.price[Op.lte] = Number(maxPrice);
  }
  if (size) where.sizes = { [Op.contains]: [size] };
  if (color) where.colors = { [Op.contains]: [color] };

  const { rows, count } = await Product.findAndCountAll({
    where,
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
    order: [['createdAt', 'DESC']],
  });

  res.json({ data: rows, total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) });
});

// Public: single product
router.get('/:id', cacheMiddleware(60), async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Admin/manager: create
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  const product = await Product.create(req.body);
  await cacheInvalidate('cache:/api/products*');
  res.status(201).json(product);
});

// Admin/manager: update
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await product.update(req.body);
  await cacheInvalidate('cache:/api/products*');
  res.json(product);
});

// Admin only: delete
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await product.destroy();
  await cacheInvalidate('cache:/api/products*');
  res.json({ success: true });
});

module.exports = router;
