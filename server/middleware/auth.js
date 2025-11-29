// server/middleware/auth.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // 1. ดึง Token จาก Header (Format: "Bearer <token>")
  const token = req.headers["authorization"]?.split(" ")[1];

  // 2. ถ้าไม่มี Token ให้ดีดออก
  if (!token) {
    return res.status(403).json({
      success: false,
      message: "A token is required for authentication",
    });
  }

  try {
    // 3. ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // 4. ฝังข้อมูล User ลงใน req เพื่อให้ Route ถัดไปใช้งานต่อได้
    req.user = decoded;

    return next(); // ไปต่อ
  } catch (err) {
    // 5. ถ้า Token ไม่ถูกต้องหรือหมดอายุ
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

module.exports = verifyToken; // <--- สำคัญมาก! ต้อง export ฟังก์ชันออกไป
