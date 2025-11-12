const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Protect Middleware
const protect = async (req, res, next) => {
  let token;
  if (User.blocked) return res.status(403).json({ message: "Account suspended" });
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) return res.status(401).json({ message: "User not found" });
      next();
    } catch (error) {
      console.error("Auth error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) return res.status(401).json({ message: "No token provided" });
};
// ✅ Admin Only Middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

// ✅ Proper Export (BOTH included)
module.exports = { protect, adminOnly };
