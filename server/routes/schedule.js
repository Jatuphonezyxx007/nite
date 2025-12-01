const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

// GET /api/schedule/my-schedule
router.get("/my-schedule", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and Year are required" });
    }

    // ✅ แก้ไข SQL:
    // 1. ใช้ DATE_FORMAT(es.scheduled_date, '%Y-%m-%d') เพื่อล็อควันที่ให้เป็น String ไม่เพี้ยน Timezone
    // 2. JOIN attendance เพื่อเช็คสถานะการเข้างานจริง
    const sql = `
      SELECT 
        es.id,
        DATE_FORMAT(es.scheduled_date, '%Y-%m-%d') as date_str, 
        es.status as schedule_status,
        es.note,
        ws.name as shift_name,
        ws.start_time,
        ws.end_time,
        a.id as attendance_id,
        a.clock_in as actual_check_in,
        a.clock_out as actual_check_out,
        a.status as attendance_status
      FROM employee_schedules es
      LEFT JOIN work_shifts ws ON es.shift_id = ws.id
      LEFT JOIN attendance a ON es.user_id = a.user_id AND es.scheduled_date = a.date
      WHERE es.user_id = ? 
      AND MONTH(es.scheduled_date) = ? 
      AND YEAR(es.scheduled_date) = ?
      ORDER BY es.scheduled_date ASC
    `;

    const [rows] = await db.query(sql, [userId, month, year]);

    const formattedData = rows.map((row) => {
      let type = "work";
      let status = "pending";
      let shiftTime = "";

      // Format เวลาเข้างาน/ออกงาน (แสดงเฉพาะ HH:mm)
      const formatTime = (timeStr) => {
        if (!timeStr) return "-";
        // ถ้าเป็น DateTime object ให้แปลง
        if (typeof timeStr === "object") {
          return new Date(timeStr).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        // ถ้าเป็น String TIME (HH:mm:ss) ให้ตัดเอาแค่ HH:mm
        return timeStr.slice(0, 5);
      };

      if (row.start_time && row.end_time) {
        shiftTime = `${row.start_time.slice(0, 5)} - ${row.end_time.slice(
          0,
          5
        )}`;
      }

      // --- Logic คำนวณสถานะ ---
      if (row.schedule_status === "holiday") {
        type = "holiday";
        status = "holiday";
      } else if (row.attendance_id) {
        // มีการลงเวลาแล้ว
        type = "work";
        // ใช้สถานะจาก attendance ถ้ามี หรือถ้าไม่มีให้เช็คเวลาเข้า
        status = row.attendance_status === "late" ? "late" : "ontime";
      } else if (new Date(row.date_str) < new Date().setHours(0, 0, 0, 0)) {
        // วันที่ผ่านมาแล้ว แต่ไม่มี attendance = ขาดงาน
        type = "work";
        status = "absent";
      } else {
        type = "work";
        status = "scheduled"; // รอทำงาน
      }

      return {
        date: row.date_str, // ✅ ใช้วันที่ String ตรงๆ จาก DB
        type: type,
        status: status,
        shift: shiftTime,
        checkIn: formatTime(row.actual_check_in),
        checkOut: formatTime(row.actual_check_out),
        title: row.note || row.shift_name,
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Fetch Schedule Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
