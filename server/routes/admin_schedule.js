// server/routes/admin_schedule.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");

// Middleware
const verifyAdmin = (req, res, next) => {
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

router.use(verifyAdmin);

// --- Helper: Format Date safely (Fix Timezone Issue) ---
const formatDateSafe = (dateObj) => {
  if (!dateObj) return null;
  const d = new Date(dateObj);
  // ใช้ getFullYear, getMonth, getDate เพื่อดึงค่า Local Time ของ Server
  // แต่เพื่อความชัวร์ที่สุด ให้แปลงเป็น string แล้วตัดเอา
  // หรือใช้ toLocaleString('en-CA') จะได้ format YYYY-MM-DD

  // วิธีที่ปลอดภัยที่สุดสำหรับ MySQL Date type:
  // ดึงค่ามาเป็น string ตรงๆ หรือ บวก timezone offset กลับไป

  // Simple Fix: ใช้ toLocaleString ใน timezone ไทย หรือ UTC+7
  // แต่ถ้า server ตั้งเวลาไว้แล้ว ให้ใช้ logic นี้:

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 1. HOLIDAYS
router.get("/holidays", async (req, res) => {
  try {
    const { month, year } = req.query;
    let sql = "SELECT * FROM holidays";
    let params = [];

    if (month && year) {
      sql += " WHERE MONTH(holiday_date) = ? AND YEAR(holiday_date) = ?";
      params = [month, year];
    }
    sql += " ORDER BY holiday_date ASC";
    const [rows] = await db.query(sql, params);

    // Fix Date
    const fixedRows = rows.map((r) => ({
      ...r,
      holiday_date: formatDateSafe(r.holiday_date),
    }));

    res.json(fixedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/holidays", async (req, res) => {
  const { date, description } = req.body;
  if (!date || !description)
    return res.status(400).json({ error: "Missing data" });
  try {
    await db.query(
      "INSERT INTO holidays (holiday_date, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = ?",
      [date, description, description]
    );
    res.json({ message: "Holiday saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/holidays/:dateStr", async (req, res) => {
  const { description } = req.body;
  const { dateStr } = req.params;
  try {
    await db.query(
      "UPDATE holidays SET description = ? WHERE holiday_date = ?",
      [description, dateStr]
    );
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/holidays/:dateStr", async (req, res) => {
  const { dateStr } = req.params;
  try {
    await db.query("DELETE FROM holidays WHERE holiday_date = ?", [dateStr]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SCHEDULES (ASSIGNMENT)
router.get("/schedules", async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year)
    return res.status(400).json({ error: "Month/Year required" });

  try {
    const sql = `
            SELECT es.*, ws.name as shift_name, ws.color as shift_color
            FROM employee_schedules es
            LEFT JOIN work_shifts ws ON es.shift_id = ws.id
            WHERE MONTH(es.scheduled_date) = ? AND YEAR(es.scheduled_date) = ?
        `;
    const [rows] = await db.query(sql, [month, year]);

    // ✅ FIX: ใช้ formatDateSafe แทน toISOString
    const formatted = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      date: formatDateSafe(r.scheduled_date), // แก้ตรงนี้
      shift_id: r.shift_id,
      status: r.status,
      shift_name: r.shift_name,
      shift_color: r.shift_color,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/assign", async (req, res) => {
  const { date, assignments } = req.body;
  if (!date || !assignments)
    return res.status(400).json({ error: "Invalid data" });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of assignments) {
      if (item.shift_id) {
        const [exists] = await connection.query(
          "SELECT id FROM employee_schedules WHERE user_id = ? AND scheduled_date = ?",
          [item.user_id, date]
        );
        if (exists.length > 0) {
          await connection.query(
            "UPDATE employee_schedules SET shift_id = ?, updated_at = NOW() WHERE id = ?",
            [item.shift_id, exists[0].id]
          );
        } else {
          await connection.query(
            "INSERT INTO employee_schedules (user_id, shift_id, scheduled_date, assigned_by) VALUES (?, ?, ?, ?)",
            [item.user_id, item.shift_id, date, req.user.id]
          );
        }
      } else {
        await connection.query(
          "DELETE FROM employee_schedules WHERE user_id = ? AND scheduled_date = ?",
          [item.user_id, date]
        );
      }
    }
    await connection.commit();
    res.json({ message: "Schedule saved successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to save schedule" });
  } finally {
    connection.release();
  }
});

module.exports = router;
