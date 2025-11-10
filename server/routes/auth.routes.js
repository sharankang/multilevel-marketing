const express = require('express');
const router = express.Router();

// Import the controller functions that hold the logic
const {
  register,
  login,
  setupRootMember, // This is a special route for one-time setup
} = require('../controllers/auth.controller');

// @route   POST /api/auth/register
// @desc    Register a new member
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login a member
router.post('/login', login);

// @route   POST /api/auth/setup-root
// @desc    (Helper route) Create the first member (M1000) and counter
router.post('/setup-root', setupRootMember);

module.exports = router;