const express = require("express");
const router = express.Router();
const db = require("../config/db"); // ตรวจสอบ path ให้ถูก
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 🛠️ FIX: แก้ไข SQL Syntax ให้ถูกต้อง
    // 1. ลบลูกน้ำ (,) หลัง e.profile_image
    // 2. ลบคำว่า Employees ที่ลอยอยู่ผิดที่ออก
    const sql = `
      SELECT 
        u.id AS user_id, 
        u.username, 
        u.password_hash, 
        u.email,
        r.name AS role,
        e.id AS emp_id,
        e.emp_code,
        e.name_th,
        e.lastname_th,
        e.nickname_th,
        e.name_en,
        e.lastname_en,
        e.position,
        e.profile_image
      FROM users u
      LEFT JOIN role r ON u.role_id = r.id
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.username = ?
    `;

    const [rows] = await db.query(sql, [username]);

    // 1. ตรวจสอบว่าพบ User หรือไม่
    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" });
    }

    const user = rows[0];

    // 2. ตรวจสอบรหัสผ่าน (Hash)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // 3. เตรียมข้อมูลสำหรับ Payload (ส่งกลับไปให้ Frontend ใช้แสดงผล)
    // ตรงนี้สำคัญมาก เพื่อให้ Login.jsx แสดงชื่อได้ถูกต้อง
    const payload = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role || "user", // Default เป็น user ถ้าไม่มี Role
      emp_code: user.emp_code || "",
      // ใช้ Logic เดียวกับ Frontend เพื่อความชัวร์ หรือส่งค่าว่างไปถ้าไม่มีข้อมูล
      name_th: user.name_th || "",
      lastname_th: user.lastname_th || "",
      nickname_th: user.nickname_th || "",
      position: user.position || "",
      profile_image: user.profile_image || "",
    };

    // 4. สร้าง JWT Token
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "8h", // ปรับเวลาตามความเหมาะสม (เช่น 8 ชม. เวลาทำงาน)
    });

    // 5. ส่ง Response
    // โครงสร้างนี้ตรงกับ const { token, user } = res.data; ใน Login.jsx เป๊ะ
    res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: payload,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
});

module.exports = router;
