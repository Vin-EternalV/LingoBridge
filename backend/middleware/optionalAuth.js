// middleware/optionalAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Attaches req.user if a valid Bearer token is present.
// Never rejects — falls through silently if no/invalid token.
const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_e) {
    // ignore — treat as anonymous
  }
  next();
};

module.exports = { optionalAuth };
