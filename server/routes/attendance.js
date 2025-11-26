const express = require("express");
const router = express.Router();
const db = require("../config/db");
const moment = require("moment");
const jwt = require("jsonwebtoken");

// Middleware ตรวจสอบ Token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).send("Token required");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    next();
  } catch (err) {
    res.status(401).send("Invalid Token");
  }
};

// ลงเวลาเข้างาน (Clock In)
router.post("/clock-in", verifyToken, async (req, res) => {
  const { image } = req.body;
  const userId = req.user.id;
  const now = moment();
  const date = now.format("YYYY-MM-DD");
  const datetime = now.format("YYYY-MM-DD HH:mm:ss");

  // ตรวจสอบว่าวันนี้ลงเวลาไปหรือยัง
  const [existing] = await db.query(
    "SELECT * FROM attendance WHERE user_id = ? AND date = ?",
    [userId, date]
  );
  if (existing.length > 0)
    return res.status(400).json({ message: "วันนี้คุณลงเวลาเข้างานไปแล้ว" });

  // เช็คสาย (สมมติเข้างาน 09:00)
  const shiftStart = moment(`${date} 09:00:00`);
  const status = now.isAfter(shiftStart) ? "late" : "on_time";

  try {
    await db.query(
      "INSERT INTO attendance (user_id, date, clock_in, clock_in_image, status) VALUES (?, ?, ?, ?, ?)",
      [userId, date, datetime, image, status]
    );
    res.json({ message: "บันทึกเวลาเข้างานสำเร็จ", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดูประวัติการลงเวลาของตัวเอง
router.get("/history", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 30",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
