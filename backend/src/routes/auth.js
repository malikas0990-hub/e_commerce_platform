const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { User, Customer } = require('../models');
const { signToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  company: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
});

// Register (always creates a "customer" role account)
router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const exists = await User.findOne({ where: { email: value.email } });
  if (exists) return res.status(409).json({ error: 'This email is already registered' });

  const hash = await bcrypt.hash(value.password, 10);
  const user = await User.create({
    name: value.name,
    email: value.email,
    password: hash,
    role: 'customer',
  });
  await Customer.create({ userId: user.id, company: value.company, phone: value.phone, status: 'lead' });

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
