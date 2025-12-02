const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

router.get("/my-schedule", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and Year are required" });
    }

    // 1. ดึงตารางงาน + การลงเวลา + วันหยุด
    const sqlSchedule = `
      SELECT 
        es.id,
        DATE_FORMAT(es.scheduled_date, '%Y-%m-%d') as date_str, 
        es.status as schedule_status,
        ws.name as shift_name,
        ws.start_time,
        ws.end_time,
        ws.color as shift_color,
        
        a.id as attendance_id,
        a.clock_in as actual_check_in,
        a.clock_out as actual_check_out,
        a.clock_in_image,
        a.clock_out_image,
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
      
      SELECT 
        NULL as id,
        DATE_FORMAT(holiday_date, '%Y-%m-%d') as date_str,
        'holiday' as schedule_status,
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
    `;

    const [scheduleRows] = await db.query(sqlSchedule, [
      userId,
      month,
      year,
      month,
      year,
      userId,
    ]);

    // 2. ดึงข้อมูลการลา (Leaves) ที่ Approved แล้ว
    const sqlLeaves = `
      SELECT 
        l.id,
        lt.name as leave_type_name,
        DATE_FORMAT(l.start_date, '%Y-%m-%d') as start_str,
        DATE_FORMAT(l.end_date, '%Y-%m-%d') as end_str,
        l.status
      FROM leaves l
      JOIN leave_types lt ON l.leave_type_id = lt.id
      WHERE l.user_id = ? 
      AND l.status = 'approved'
      AND (
        (MONTH(l.start_date) = ? AND YEAR(l.start_date) = ?) OR
        (MONTH(l.end_date) = ? AND YEAR(l.end_date) = ?)
      )
    `;
    const [leaveRows] = await db.query(sqlLeaves, [
      userId,
      month,
      year,
      month,
      year,
    ]);

    // 3. Merge Data
    const finalMap = {};

    // ใส่ Schedule ก่อน
    scheduleRows.forEach((row) => {
      finalMap[row.date_str] = {
        id: row.id,
        date: row.date_str,
        type: "work",
        status: "pending",
        title: row.shift_name || "Shift",
        color: row.shift_color || "#ccc",
        shift:
          row.start_time && row.end_time
            ? `${row.start_time.slice(0, 5)} - ${row.end_time.slice(0, 5)}`
            : "",
        checkIn: row.actual_check_in
          ? new Date(row.actual_check_in).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        checkOut: row.actual_check_out
          ? new Date(row.actual_check_out).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        checkInImage: row.clock_in_image,
        checkOutImage: row.clock_out_image,

        // Flags
        is_holiday: !!row.holiday_name || row.schedule_status === "holiday",
        holiday_name: row.holiday_name,
        is_off: row.schedule_status === "off",
        has_attendance: !!row.attendance_id,
        punctuality: row.attendance_punctuality,
        actual_in: row.actual_check_in,
      };
    });

    // ทับด้วย Leaves (แตกเป็นรายวัน)
    leaveRows.forEach((leave) => {
      let curr = new Date(leave.start_str);
      const end = new Date(leave.end_str);

      while (curr <= end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, "0");
        const d = String(curr.getDate()).padStart(2, "0");
        const dateKey = `${y}-${m}-${d}`;

        if (curr.getMonth() + 1 == month && curr.getFullYear() == year) {
          // สีตามประเภทลา
          let leaveColor = "#8b5cf6"; // ม่วง (Default)
          if (leave.leave_type_name.includes("ป่วย")) leaveColor = "#ef4444"; // แดง
          if (leave.leave_type_name.includes("พักร้อน")) leaveColor = "#f59e0b"; // ส้ม
          if (leave.leave_type_name.includes("กิจ")) leaveColor = "#3b82f6"; // ฟ้า

          finalMap[dateKey] = {
            ...finalMap[dateKey],
            id: `leave-${dateKey}`,
            date: dateKey,
            type: "leave",
            status: "leave",
            title: leave.leave_type_name, // แสดงชื่อประเภทลาเลย
            color: leaveColor,
            shift: "ทั้งวัน",
            is_leave: true,
          };
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    // Finalize Logic
    Object.values(finalMap).forEach((item) => {
      if (item.is_leave) return;

      if (item.is_holiday) {
        item.type = "holiday";
        item.status = "holiday";
        item.title = item.holiday_name || "วันหยุดนักขัตฤกษ์";
        item.color = "#ef4444";
      } else if (item.is_off) {
        item.type = "off";
        item.status = "off";
        item.title = "วันหยุดประจำสัปดาห์";
        item.color = "#64748b";
      } else if (item.has_attendance) {
        item.type = "work";
        // ถ้ามีเวลาเข้าแล้วแต่ยังไม่ออก = working, ถ้าออกแล้ว = ดู punctuality
        if (item.actual_in && item.checkOut === "-") {
          item.status = "working";
        } else {
          item.status = item.punctuality === "late" ? "late" : "ontime";
        }
      } else {
        // Check Absent
        const itemDate = new Date(item.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (itemDate < today) {
          item.status = "absent";
        } else {
          item.status = "scheduled";
        }
      }
    });

    const finalResult = Object.values(finalMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    res.json(finalResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
