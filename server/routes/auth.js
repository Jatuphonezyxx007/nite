// server/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Query ข้อมูล User + Employee
    const sql = `
      SELECT 
        u.id AS user_id, 
        u.username, 
        u.password_hash, 
        u.role, 
        u.email,
        e.id AS emp_id,
        e.emp_code,
        e.name_th,
        e.lastname_th,
        e.nickname_th,
        e.name_en,
        e.lastname_en,
        e.position,
        u.profile_image
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.username = ?
    `;

    const [rows] = await db.query(sql, [username]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" });
    }

    const user = rows[0];

    // 2. เช็ค Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // 3. สร้าง Token (ใส่ข้อมูลจำเป็นลงไปใน Payload)
    const payload = {
      id: user.user_id,
      username: user.username,
      role: user.role,
      emp_code: user.emp_code || "",
      name_th: user.name_th || user.username,
      lastname_th: user.lastname_th || "",
      position: user.position || "",
      profile_image: user.profile_image || "",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "5h",
    });

    // ✅ 4. ส่ง Token และ User Data กลับไปเป็น JSON (ไม่ต้องใช้ Cookie)
    res.json({
      success: true,
      message: "Login Success",
      token,
      user: payload, // ส่งข้อมูล User ไปให้ Frontend ใช้เลย (ไม่ต้องรอแกะ Token)
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
});

module.exports = router;
