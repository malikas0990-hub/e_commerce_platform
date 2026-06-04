const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { User } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Staff management is superadmin-only (CRM role hierarchy: Superadmin > Admin > Manager).
router.use(authenticateToken, authorizeRoles('superadmin'));

// List all staff/users
router.get('/', async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });
  res.json(users);
});

const createSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'manager').required(),
});

// Create a new staff account (admin or manager)
router.post('/', async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const exists = await User.findOne({ where: { email: value.email } });
  if (exists) return res.status(409).json({ error: 'This email already exists' });

  const hash = await bcrypt.hash(value.password, 10);
  const user = await User.create({ name: value.name, email: value.email, password: hash, role: value.role });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
});

// Change a user's role (cannot touch other superadmins)
router.patch('/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'manager', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'superadmin') return res.status(403).json({ error: 'Superadmin role cannot be changed' });

  await user.update({ role });
  res.json({ id: user.id, role: user.role });
});

// Delete a user (cannot delete superadmin or self)
router.delete('/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'superadmin') return res.status(403).json({ error: 'Superadmin cannot be deleted' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'You cannot delete yourself' });
  await user.destroy();
  res.json({ success: true });
});

module.exports = router;
