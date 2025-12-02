// server/routes/shifts.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");

// --- Middleware: ตรวจสอบ Token เฉยๆ (สำหรับ User/Admin) ---
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).send("Token required");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send("Invalid Token");
  }
};

// --- Middleware: ตรวจสอบ Admin (สำหรับ Create/Update/Delete) ---
const verifyAdmin = (req, res, next) => {
  // เรียกใช้ verifyToken ก่อน หรือเขียนรวมกันก็ได้ แต่แยกกันชัดเจนกว่า
  verifyToken(req, res, () => {
    // สมมติ Logic เช็ค Admin (ปรับตาม DB คุณ เช่น req.user.role === 'admin')
    // if (req.user.role !== 'admin') return res.status(403).send("Admin Access Only");
    next();
  });
};

// ----------------------------------------------------
// ✅ 1. GET: ดึงข้อมูลกะ (ใช้ / เฉยๆ เพราะ index.js กำหนด prefix แล้ว)
//    User ทั่วไปก็ดูได้ (ใช้ verifyToken)
// ----------------------------------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM work_shifts ORDER BY start_time ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------------------------------------
// ✅ 2. CUD Operations: ต้องเป็น Admin เท่านั้น
// ----------------------------------------------------

// POST: สร้างกะใหม่
router.post("/", verifyAdmin, async (req, res) => {
  const { name, start_time, end_time, break_minutes, color } = req.body;
  try {
    await db.query(
      "INSERT INTO work_shifts (name, start_time, end_time, break_minutes, color) VALUES (?, ?, ?, ?, ?)",
      [name, start_time, end_time, break_minutes, color]
    );
    res.status(201).json({ message: "Created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: แก้ไขกะ
router.put("/:id", verifyAdmin, async (req, res) => {
  const { name, start_time, end_time, break_minutes, color } = req.body;
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE work_shifts SET name=?, start_time=?, end_time=?, break_minutes=?, color=? WHERE id=?",
      [name, start_time, end_time, break_minutes, color, id]
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE: ลบกะ
router.delete("/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM work_shifts WHERE id=?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
