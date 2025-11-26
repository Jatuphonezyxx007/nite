const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
// router.get("/users", verifyAdmin, async (req, res) => {
//   try {
//     const [users] = await db.query("SELECT * FROM users");
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    // รับค่า query parameter ชื่อ 'deleted' มาจาก Frontend
    // ถ้าส่งมาเป็น 'true' ให้ดึงคนที่ถูกลบ ถ้าไม่ส่งมา ให้ดึงคนปกติ
    const showDeleted = req.query.deleted === "true";

    let sql;
    if (showDeleted) {
      // ดึงเฉพาะคนที่ถูก Soft Delete ไปแล้ว
      sql =
        "SELECT * FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC";
    } else {
      // ดึงเฉพาะคนปกติ (ค่า default)
      sql = "SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id ASC";
    }

    const [users] = await db.query(sql);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. เพิ่มพนักงานใหม่
router.post("/users", verifyAdmin, async (req, res) => {
  const { name, email, password, role, position } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await db.query(
      "INSERT INTO users (name, email, password_hash, role, position) VALUES (?, ?, ?, ?, ?)",
      [name, email, hash, role || "user", position]
    );
    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ลบพนักงาน (ห้ามลบตัวเอง)
// router.delete("/users/:id", verifyAdmin, async (req, res) => {
//   const targetId = req.params.id;
//   if (parseInt(targetId) === req.user.id)
//     return res.status(400).json({ message: "Cannot delete yourself" });

//   try {
//     await db.query("DELETE FROM users WHERE id = ?", [targetId]);
//     res.json({ message: "User deleted" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  const targetId = req.params.id;

  // ป้องกันการลบตัวเอง
  if (parseInt(targetId) === req.user.id)
    return res.status(400).json({ message: "Cannot delete yourself" });

  try {
    // เปลี่ยนจาก DELETE FROM... เป็น UPDATE...
    const sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?";

    await db.query(sql, [targetId]);
    res.json({ message: "User soft deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Dashboard Stats (Real-time Attendance)
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users");
    const [presentToday] = await db.query(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ?",
      [today]
    );
    const [lateToday] = await db.query(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'late'",
      [today]
    );

    // ดึงรายการคนเข้างานวันนี้ล่าสุด 5 คน
    const [recent] = await db.query(
      `
            SELECT a.*, u.name 
            FROM attendance a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.date = ? 
            ORDER BY a.clock_in DESC LIMIT 5`,
      [today]
    );

    res.json({
      totalUsers: totalUsers[0].count,
      present: presentToday[0].count,
      late: lateToday[0].count,
      recentActivity: recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
