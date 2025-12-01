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

    // SQL: ดึงตารางงาน + กะงาน + การลงเวลา + วันหยุด
    const sql = `
      SELECT 
        es.id,
        DATE_FORMAT(es.scheduled_date, '%Y-%m-%d') as date_str, 
        es.status as schedule_status,
        es.note,
        ws.name as shift_name,
        ws.start_time,
        ws.end_time,
        ws.color as shift_color, 
        a.id as attendance_id,
        a.clock_in as actual_check_in,
        a.clock_out as actual_check_out,
        a.status as attendance_punctuality, -- on_time, late, absent
        h.description as holiday_name
      FROM employee_schedules es
      LEFT JOIN work_shifts ws ON es.shift_id = ws.id
      LEFT JOIN attendance a ON es.user_id = a.user_id AND es.scheduled_date = a.date
      LEFT JOIN holidays h ON es.scheduled_date = h.holiday_date
      WHERE es.user_id = ? 
      AND MONTH(es.scheduled_date) = ? 
      AND YEAR(es.scheduled_date) = ?
      ORDER BY es.scheduled_date ASC
    `;

    const [rows] = await db.query(sql, [userId, month, year]);

    // Process Data
    const formattedData = rows.map((row) => {
      let type = "work";
      let status = "pending"; // default
      let title = row.shift_name || "Shift";
      let shiftTime = "";

      // Format เวลาเข้า-ออกตามแผน
      if (row.start_time && row.end_time) {
        shiftTime = `${row.start_time.slice(0, 5)} - ${row.end_time.slice(
          0,
          5
        )}`;
      }

      // --- LOGIC การตัดสินสถานะ ---

      // 1. ตรวจสอบว่าเป็นวันหยุดหรือไม่ (Holiday)
      if (row.holiday_name || row.schedule_status === "holiday") {
        type = "holiday";
        status = "holiday";
        title = row.holiday_name || row.note || "วันหยุด";
      }
      // 2. ตรวจสอบสถานะวันหยุดประจำสัปดาห์ (Off)
      else if (row.schedule_status === "off") {
        type = "off";
        status = "off";
        title = "วันหยุดประจำสัปดาห์";
      }
      // 3. ตรวจสอบการลงเวลา (Attendance)
      else if (row.attendance_id) {
        type = "work";

        if (row.actual_check_in && !row.actual_check_out) {
          // มีเวลาเข้า แต่ไม่มีเวลาออก = กำลังทำงาน
          status = "working";
        } else {
          // มีเวลาออกแล้ว หรือจบงานแล้ว = ดูสถานะความตรงต่อเวลา
          // map ค่าจาก db (on_time, late) ไปเป็นค่าที่ frontend รู้จัก
          status = row.attendance_punctuality === "late" ? "late" : "ontime";
        }

        // กรณีมาทำงานในวันหยุด (OT)
        if (row.holiday_name) title = `${row.shift_name} (OT)`;
      }
      // 4. กรณีไม่มีการลงเวลา
      else {
        const scheduleDate = new Date(row.date_str);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (scheduleDate < today) {
          // วันที่ผ่านมาแล้ว แต่ไม่ลงเวลา = ขาดงาน
          type = "work";
          status = "absent";
        } else {
          // วันนี้ หรือ อนาคต = รอลงเวลา (Scheduled)
          type = "work";
          status = "scheduled";
        }
      }

      // Helper: Format เวลาไทย (ตัดวินาทีออก)
      const formatTime = (dt) => {
        if (!dt) return "-";
        return new Date(dt).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      return {
        id: row.id,
        date: row.date_str,
        type: type,
        status: status, // ontime, late, working, absent, scheduled, holiday, off
        title: title,
        shift: shiftTime,
        checkIn: formatTime(row.actual_check_in),
        checkOut: formatTime(row.actual_check_out),
        color: row.shift_color,
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Fetch Schedule Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
