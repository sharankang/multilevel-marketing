const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  getMyProfile,
  getDownline,
} = require('../controllers/member.controller');

// Import the 'protect' middleware
const { protect } = require('../middleware/auth.middleware');

// @route   GET /api/member/me
// @desc    Get the profile of the currently logged-in member
// @access  Private (notice 'protect' is used here)
router.get('/me', protect, getMyProfile);

// @route   GET /api/member/downline
// @desc    Get the downline (left and right members) of the logged-in member
// @access  Private
router.get('/downline', protect, getDownline);

module.exports = router;