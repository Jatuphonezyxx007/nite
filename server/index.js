require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import Routes (เดี๋ยวสร้างไฟล์เหล่านี้)
// const authRoutes = require('./routes/auth');
// const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" })); // รองรับรูป Base64 ขนาดใหญ่

// Database Connection (ควรแยกไฟล์ แต่ใส่ตรงนี้ก่อนตามโครงสร้างเดิม)
const mysql = require("mysql2");
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("❌ DB Error:", err);
  else console.log("✅ DB Connected");
});

// --- Middleware ตรวจสอบ Token (Security) ---
const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).send("A token is required");
  try {
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET || "secretkey"
    );
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

// --- Mock API Logic (จริงๆ ควรแยกไฟล์ Route) ---

// 1. Login Logic
const bcrypt = require("bcryptjs");
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = results[0];
    // เช็ค Password (ใน DB จริงต้องเป็น Hash)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // สร้าง Token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "8h" }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  });
});

// 2. Clock In API (พร้อมถ่ายรูป)
const moment = require("moment");
app.post("/api/attendance/clock-in", verifyToken, (req, res) => {
  const { image } = req.body; // รับภาพ Base64
  const userId = req.user.id;
  const now = moment();
  const date = now.format("YYYY-MM-DD");
  const time = now.format("HH:mm:ss");

  // Logic เช็คเวลาเข้างาน (Hardcode 09:00 สำหรับตัวอย่าง)
  const shiftStart = moment(`${date} 09:00:00`);
  const status = now.isAfter(shiftStart) ? "late" : "on_time";

  const sql =
    "INSERT INTO attendance (user_id, date, clock_in, clock_in_image, status) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [userId, date, now.format("YYYY-MM-DD HH:mm:ss"), image, status],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Clock In Success", status });
    }
  );
});

// 3. Get Dashboard Stats (Admin)
app.get("/api/admin/dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Admin only");

  // Example: Count users present today
  const today = moment().format("YYYY-MM-DD");
  const sql = "SELECT COUNT(*) as count FROM attendance WHERE date = ?";
  db.query(sql, [today], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json({ presentToday: results[0].count });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
