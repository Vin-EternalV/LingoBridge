const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user && !user.isActive && user.suspension?.until && user.suspension.until <= new Date()) {
      user.isActive = true;
      user.suspension = { until: null, reason: '' };
      await user.save({ validateBeforeSave: false });
    }

    if (!user || !user.isActive || (decoded.tv || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

module.exports = { protect };
