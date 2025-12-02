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

    // --- 1. ดึงตารางงาน, วันหยุด และข้อมูลการลงเวลา (รวมรูปภาพ) ---
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
        a.clock_in_image,   -- ✅ เพิ่มดึงรูปเข้า
        a.clock_out_image,  -- ✅ เพิ่มดึงรูปออก
        a.status as attendance_punctuality,
        h.description as holiday_name
      FROM employee_schedules es
      LEFT JOIN work_shifts ws ON es.shift_id = ws.id
      LEFT JOIN attendance a ON es.user_id = a.user_id AND es.scheduled_date = a.date
      LEFT JOIN holidays h ON es.scheduled_date = h.holiday_date
      WHERE es.user_id = ? 
      AND MONTH(es.scheduled_date) = ? 
      AND YEAR(es.scheduled_date) = ?
      
      UNION ALL
      
      -- ดึงวันหยุดที่ไม่มีตารางงาน
      SELECT 
        NULL as id,
        DATE_FORMAT(holiday_date, '%Y-%m-%d') as date_str,
        'holiday' as schedule_status,
        NULL as note,
        NULL as shift_name,
        NULL as start_time,
        NULL as end_time,
        '#ef4444' as shift_color,
        NULL as attendance_id,
        NULL as actual_check_in,
        NULL as actual_check_out,
        NULL as clock_in_image,
        NULL as clock_out_image,
        NULL as attendance_punctuality,
        description as holiday_name
      FROM holidays
      WHERE MONTH(holiday_date) = ? 
      AND YEAR(holiday_date) = ?
      AND holiday_date NOT IN (SELECT scheduled_date FROM employee_schedules WHERE user_id = ?)
      
      ORDER BY date_str ASC
    `;

    const [rows] = await db.query(sql, [
      userId,
      month,
      year,
      month,
      year,
      userId,
    ]);

    // Process Data
    const formattedData = rows.map((row) => {
      let type = "work";
      let status = "pending";
      let title = row.shift_name || "Shift";
      let shiftTime = "";

      if (row.start_time && row.end_time) {
        shiftTime = `${row.start_time.slice(0, 5)} - ${row.end_time.slice(
          0,
          5
        )}`;
      }

      // --- LOGIC ---

      // 1. วันหยุด (Holiday)
      if (row.holiday_name || row.schedule_status === "holiday") {
        type = "holiday";
        status = "holiday";
        title = row.holiday_name || "วันหยุดนักขัตฤกษ์";
      }
      // 2. วันหยุดประจำสัปดาห์ (Off)
      else if (row.schedule_status === "off") {
        type = "off";
        status = "off";
        title = "วันหยุดประจำสัปดาห์";
      }
      // 3. ตรวจสอบการลงเวลา (Attendance)
      else if (row.attendance_id) {
        type = "work";
        if (row.actual_check_in && !row.actual_check_out) {
          status = "working"; // กำลังทำงาน (ยังไม่ออก)
        } else {
          // ใช้สถานะจากตาราง attendance (on_time, late)
          status = row.attendance_punctuality === "late" ? "late" : "ontime";
        }

        if (row.holiday_name) title = `${row.shift_name} (OT)`;
      }
      // 4. ขาดงาน / รอลงเวลา
      else {
        const scheduleDate = new Date(row.date_str);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (scheduleDate < today) {
          type = "work";
          status = "absent"; // เลยวันมาแล้วแต่ไม่ลงเวลา = ขาดงาน
        } else {
          type = "work";
          status = "scheduled"; // ยังไม่ถึงวัน
        }
      }

      const formatTime = (dt) => {
        if (!dt) return "-";
        return new Date(dt).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      return {
        id: row.id || `hol-${row.date_str}`,
        date: row.date_str,
        type: type,
        status: status,
        title: title,
        shift: shiftTime,
        checkIn: formatTime(row.actual_check_in),
        checkOut: formatTime(row.actual_check_out),
        // ส่งรูปภาพกลับไปด้วย (ถ้ามี)
        checkInImage: row.clock_in_image,
        checkOutImage: row.clock_out_image,
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
