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

    // 1. ดึงตารางงาน (Plan) เชื่อมกับ การลงเวลาจริง (Actual)
    const sql = `
      SELECT 
        es.id,
        DATE_FORMAT(es.scheduled_date, '%Y-%m-%d') as date_str,
        es.status as schedule_status, -- สถานะจากตารางงาน (scheduled, off, holiday)
        es.note,
        ws.name as shift_name,
        TIME_FORMAT(ws.start_time, '%H:%i') as shift_start,
        TIME_FORMAT(ws.end_time, '%H:%i') as shift_end,
        a.clock_in,      -- เวลาเข้างานจริงจากตาราง attendance
        a.clock_out,     -- เวลาออกงานจริงจากตาราง attendance
        a.status as attendance_status -- สถานะจากระบบลงเวลา (late, on_time)
      FROM employee_schedules es
      LEFT JOIN work_shifts ws ON es.shift_id = ws.id
      LEFT JOIN attendance a ON es.user_id = a.user_id AND es.scheduled_date = a.date
      WHERE es.user_id = ? 
      AND MONTH(es.scheduled_date) = ? 
      AND YEAR(es.scheduled_date) = ?
      ORDER BY es.scheduled_date ASC
    `;

    const [rows] = await db.query(sql, [userId, month, year]);

    // 2. แปลงข้อมูล
    const formattedData = rows.map((row) => {
      let type = "work";
      let status = "scheduled";
      let title = row.shift_name;

      // --- Logic คำนวณสถานะ ---
      if (row.schedule_status === "off" || row.schedule_status === "holiday") {
        type = "off";
        status = "off";
        title = "วันหยุด (Off)";
      } else if (row.clock_in) {
        // มีการลงเวลาจริงแล้ว
        type = "work";
        // เช็คสถานะจากตาราง attendance หรือคำนวณใหม่
        if (row.attendance_status === "late") {
          status = "late";
        } else {
          status = "ontime";
        }
      } else {
        // ยังไม่ลงเวลา
        const scheduleDate = new Date(row.date_str);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (scheduleDate < today) {
          status = "absent"; // ผ่านมาแล้ว = ขาดงาน
        } else {
          status = "scheduled"; // อนาคต = รอปฏิบัติงาน
        }
      }

      // Format เวลา
      const timeInStr = row.clock_in
        ? new Date(row.clock_in).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;
      const timeOutStr = row.clock_out
        ? new Date(row.clock_out).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;

      return {
        date: row.date_str,
        type,
        status, // ontime, late, absent, scheduled, off
        shiftTime:
          row.shift_start && row.shift_end
            ? `${row.shift_start} - ${row.shift_end}`
            : "",
        actualIn: timeInStr,
        actualOut: timeOutStr,
        title: row.note || title,
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Fetch Schedule Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
