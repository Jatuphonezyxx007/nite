// server/middleware/auth.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // อ่าน Token จาก Cookie แทน Header
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(403)
      .json({ success: false, message: "No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

module.exports = verifyToken;
