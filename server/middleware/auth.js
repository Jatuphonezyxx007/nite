// server/middleware/auth.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // ❌ ลบอันเก่าออก: const token = req.cookies.token;

  // ✅ 1. อ่าน Token จาก Header (Format: "Bearer <token>")
  const authHeader = req.headers["authorization"];

  // ถ้ามี Header ให้ตัดคำว่า "Bearer " ออกเพื่อเอาเฉพาะตัว Token
  const token = authHeader && authHeader.split(" ")[1];

  // 2. ถ้าไม่มี Token ส่งมา
  if (!token) {
    return res
      .status(403)
      .json({ success: false, message: "No Token Provided" });
  }

  try {
    // 3. ตรวจสอบความถูกต้อง
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

module.exports = verifyToken;
