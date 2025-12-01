const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/profile/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "user-" + uniqueSuffix + path.extname(file.originalname).toLowerCase()
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, webp) เท่านั้น!"));
  },
});

const verifyAdmin = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).send("Token required");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).send("Admin access only");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send("Invalid Token");
  }
};

// 1. ดึงรายชื่อพนักงานทั้งหมด
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const showDeleted = req.query.deleted === "true";
    let sql;
    if (showDeleted) {
      sql =
        "SELECT * FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC";
    } else {
      sql = "SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id ASC";
    }
    const [users] = await db.query(sql);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. เพิ่มพนักงานใหม่ (Create)
router.post(
  "/users",
  verifyAdmin,
  upload.single("profile_image"),
  async (req, res) => {
    const {
      username,
      emp_code,
      prefix_th,
      name_th,
      lastname_th,
      nickname_th,
      prefix_en,
      name_en,
      lastname_en,
      nickname_en,
      email,
      password,
      role,
      position,
    } = req.body;

    const profile_image = req.file ? req.file.filename : "";

    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const sql = `
      INSERT INTO users 
      (username,emp_code, prefix_th, name_th, lastname_th, nickname_th, prefix_en, name_en, lastname_en, nickname_en, email, password_hash, role, position, profile_image) 
      VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      await db.query(sql, [
        username,
        emp_code,
        prefix_th,
        name_th,
        lastname_th,
        nickname_th || "",
        prefix_en,
        name_en,
        lastname_en,
        nickname_en || "",
        email,
        hash,
        role || "user",
        position,
        profile_image,
      ]);

      res.json({ message: "User created successfully" });
    } catch (err) {
      console.error("Database Insert Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// 3. แก้ไขข้อมูลพนักงาน (Update)
router.put(
  "/users/:id",
  verifyAdmin,
  upload.single("profile_image"),
  async (req, res) => {
    const userId = req.params.id;
    const {
      username,
      prefix_th,
      name_th,
      lastname_th,
      nickname_th,
      prefix_en,
      name_en,
      lastname_en,
      nickname_en,
      email,
      password,
      role,
      position,
    } = req.body;

    try {
      let updateFields = [];
      let updateValues = [];

      const addField = (field, value) => {
        if (value !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      };

      addField("username", username);
      addField("prefix_th", prefix_th);
      addField("name_th", name_th);
      addField("lastname_th", lastname_th);
      addField("nickname_th", nickname_th);
      addField("prefix_en", prefix_en);
      addField("name_en", name_en);
      addField("lastname_en", lastname_en);
      addField("nickname_en", nickname_en);
      addField("email", email);
      addField("role", role);
      addField("position", position);

      if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        updateFields.push("password_hash = ?");
        updateValues.push(hash);
      }

      if (req.file) {
        updateFields.push("profile_image = ?");
        updateValues.push(req.file.filename);
      }

      if (updateFields.length === 0) {
        return res.json({ message: "No changes provided" });
      }

      updateFields.push("updated_at = NOW()");

      const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
      updateValues.push(userId);

      await db.query(sql, updateValues);

      res.json({ message: "User updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// 4. ลบพนักงาน (Soft Delete)
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  const targetId = req.params.id;
  if (parseInt(targetId) === req.user.id)
    return res.status(400).json({ message: "Cannot delete yourself" });

  try {
    const sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?";
    await db.query(sql, [targetId]);
    res.json({ message: "User soft deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Dashboard Stats
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // วันที่ปัจจุบัน YYYY-MM-DD

    // 1. นับพนักงานทั้งหมด (ไม่นับคนที่ถูก Soft Delete)
    const [totalUsers] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL"
    );

    // 2. นับคนที่เข้างานวันนี้ (นับ user_id ที่ไม่ซ้ำกัน เผื่อ scan หลายรอบ)
    const [presentToday] = await db.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = ?",
      [today]
    );

    // 3. นับคนที่มาสายวันนี้
    const [lateToday] = await db.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = ? AND status = 'late'",
      [today]
    );

    // 4. ดึงรายการเข้างานล่าสุดวันนี้ (Join เพื่อเอาชื่อและรูป)
    // สังเกต: เราเลือก name_th, lastname_th และ profile_image มาแสดง
    const [recent] = await db.query(
      `
      SELECT a.*, u.name_th, u.lastname_th, u.profile_image, u.emp_code
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.date = ?
      ORDER BY a.clock_in DESC
      LIMIT 5
      `,
      [today]
    );

    // ส่งข้อมูลกลับไปให้ Frontend
    res.json({
      totalUsers: totalUsers[0].count,
      present: presentToday[0].count,
      late: lateToday[0].count,
      recentActivity: recent,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. ดึงข้อมูลภาพรวมการเข้างาน (Overview Page)
router.get("/attendance-overview", verifyAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Daily Stats (วันนี้)
    const [totalUsersRes] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL"
    );
    const [attendanceRes] = await db.query(
      "SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status",
      [today]
    );

    const totalEmployees = totalUsersRes[0].count;
    let present = 0;
    let late = 0;
    let onTime = 0;

    attendanceRes.forEach((row) => {
      if (row.status === "late") late = row.count;
      if (row.status === "on_time") onTime = row.count;
    });
    present = late + onTime;
    const absent = totalEmployees - present;

    // 2. Weekly Stats (ย้อนหลัง 7 วัน)
    // Query นี้จะดึงวันที่และจำนวนคนเข้างานย้อนหลัง 7 วัน
    const [weeklyRes] = await db.query(`
      SELECT DATE(date) as date, COUNT(*) as count 
      FROM attendance 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) 
      GROUP BY date 
      ORDER BY date ASC
    `);

    // 3. Today Logs (รายการเข้างานวันนี้)
    const [logs] = await db.query(
      `
      SELECT a.*, u.name_th, u.lastname_th, u.emp_code, u.position, u.profile_image 
      FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      WHERE a.date = ? 
      ORDER BY a.clock_in DESC
    `,
      [today]
    );

    res.json({
      stats: { totalEmployees, present, late, onTime, absent },
      weeklyStats: weeklyRes,
      logs: logs,
    });
  } catch (err) {
    console.error("Attendance Overview Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
