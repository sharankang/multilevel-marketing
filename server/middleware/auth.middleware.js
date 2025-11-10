const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

// This middleware protects routes. It checks if a valid token is sent.
exports.protect = async (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // Get the token part
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    // Verify the token using the JWT_SECRET from the .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the member by the ID from the token
    // Attach the member's data to the request object (req.member)
    req.member = await Member.findById(decoded.id);

    if (!req.member) {
      return res.status(404).json({ success: false, message: 'No member found with this token' });
    }

    // Continue to the next middleware or the route handler
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};