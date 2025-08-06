const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/authMiddleware');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      NID,
      phone,
      title
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email },
          { NID: NID }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this username, email, or NID'
      });
    }

    // Create new user (without role field)
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      NID,
      phone,
      title
    });

    // Get user roles from the new role system
    let userRoles = [];
    try {
      userRoles = await user.getRoles();
    } catch (error) {
      console.log('No roles found for user:', user.id);
    }

    // Get the primary role (first role or default)
    const primaryRole = userRoles.length > 0 ? userRoles[0].name : 'user';

    // Generate JWT token with role
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: primaryRole },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        title: user.title,
        role: primaryRole,
        roles: userRoles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description
        }))
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: login },
          { email: login }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user roles from the new role system
    let userRoles = [];
    try {
      userRoles = await user.getRoles();
    } catch (error) {
      console.log('No roles found for user:', user.id);
    }

    // Get the primary role (first role or default)
    const primaryRole = userRoles.length > 0 ? userRoles[0].name : 'user';

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: primaryRole },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        NID: user.NID,
        phone: user.phone,
        title: user.title,
        email: user.email,
        role: primaryRole,
        roles: userRoles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh token with new role
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    // Verify the user has this role
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user has the requested role
    const userRoles = await user.getRoles();
    const hasRole = userRoles.some(r => r.name === role);
    
    if (!hasRole) {
      return res.status(403).json({ error: 'User does not have this role' });
    }

    // Generate new JWT token with the requested role
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 