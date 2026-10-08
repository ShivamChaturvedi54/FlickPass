const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const firestoreService = require('../services/firestoreService');

const JWT_SECRET = process.env.JWT_SECRET || 'flickpass_super_secret_jwt_key_2024';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const existing = await firestoreService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await firestoreService.createUser({ email, name, passwordHash });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, name: user.name } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await firestoreService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, name: user.name } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// POST /api/auth/demo-login - Quick demo login
router.post('/demo-login', async (req, res) => {
  try {
    await firestoreService.seedIfEmpty();
    let user = await firestoreService.findUserByEmail('demo@flickpass.com');

    if (!user) {
      const passwordHash = await bcrypt.hash('demo123', 10);
      user = await firestoreService.createUser({
        email: 'demo@flickpass.com',
        name: 'Demo User',
        passwordHash,
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, name: user.name } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Demo login failed', error: error.message });
  }
});

module.exports = router;
