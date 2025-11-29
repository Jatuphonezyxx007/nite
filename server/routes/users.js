// routes/user.js
const express = require("express");
const router = express.Router();
const db = require("../config/db"); // สมมติไฟล์ connect database
const authMiddleware = require("../middleware/auth"); // Middleware แกะ JWT

// GET /api/user/attendance
// ดึงข้อมูลการลงเวลาของ User คนที่ Login อยู่
router.get("/attendance", authMiddleware, async (req, res) => {
  try {
    // 1. ดึง userId จาก Token (Security Best Practice)
    const userId = req.user.id;

    // 2. กำหนด Limit เพื่อ Performance (เช่น ดูย้อนหลัง 30 รายการล่าสุด)
    const limit = 30;

    // 3. Query Command
    // เลือกเฉพาะฟิลด์ที่จำเป็น ไม่ควร Select * ถ้าไม่ใช้ image
    const sql = `
            SELECT 
                id, 
                date, 
                clock_in, 
                clock_out, 
                status 
            FROM attendance 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT ?
        `;

    // 4. Execute Query
    const [rows] = await db.execute(sql, [userId, limit]);

    // 5. Response
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// GET /api/user/dashboard-stats
router.get("/dashboard-stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // SQL นี้จะคำนวณ:
    // 1. total_hours: ผลรวมนาทีที่ทำงาน หาร 60 (เฉพาะที่มีเวลาออกแล้ว)
    // 2. late_days: นับจำนวนวันที่สาย
    // 3. on_time_percentage: สูตร (จำนวนที่ตรงเวลา / จำนวนทั้งหมด) * 100
    const sql = `
            SELECT 
                CAST(SUM(TIMESTAMPDIFF(MINUTE, clock_in, clock_out)) / 60 AS DECIMAL(10,1)) as total_hours,
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'on_time' THEN 1 ELSE 0 END) as on_time_days
            FROM attendance 
            WHERE user_id = ? 
            AND clock_out IS NOT NULL
        `;

    const [rows] = await db.execute(sql, [userId]);
    const data = rows[0];

    // คำนวณ Average และ Percentage เพิ่มเติม (หรือทำใน SQL ก็ได้)
    const totalDays = data.total_days || 1;
    const avgHours = (data.total_hours / totalDays).toFixed(1);
    const onTimePercent = ((data.on_time_days / totalDays) * 100).toFixed(0);

    return res.status(200).json({
      success: true,
      stats: {
        totalHours: data.total_hours || "0.0",
        averageHours: avgHours || "0.0",
        onTimePercentage: onTimePercent || "0",
        lateDays: data.late_days || "0",
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

// GET /api/user/weekly-chart
// ดึงข้อมูลสรุปชั่วโมงทำงานย้อนหลัง 7 วัน
router.get("/weekly-chart", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Query ดึงข้อมูลย้อนหลัง 7 วัน
    // ใช้ DATEDIFF หรือ TIMESTAMPDIFF เพื่อหาผลรวมชั่วโมงในแต่ละวัน
    const sql = `
      SELECT 
        DATE(date) as work_date,
        CAST(SUM(TIMESTAMPDIFF(MINUTE, clock_in, clock_out)) / 60 AS DECIMAL(10,1)) as total_hours
      FROM attendance 
      WHERE user_id = ? 
      AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      AND clock_out IS NOT NULL
      GROUP BY DATE(date)
      ORDER BY work_date ASC
    `;

    const [rows] = await db.execute(sql, [userId]);

    // 2. จัดรูปแบบข้อมูลให้ครบ 7 วัน (เผื่อวันที่ไม่ได้มาทำงาน ให้ค่าเป็น 0)
    const chartData = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // วนลูปย้อนหลัง 6 วันจนถึงวันนี้
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // Format YYYY-MM-DD

      // หาข้อมูลใน DB ที่ตรงกับวันนี้
      const record = rows.find((row) => {
        // แปลง date จาก DB เป็น string ให้ตรงกัน (อาจต้องปรับตาม timezone db)
        const rowDate = new Date(row.work_date).toISOString().split("T")[0];
        return rowDate === dateStr;
      });

      chartData.push({
        day: days[d.getDay()], // ชื่อวัน (Mon, Tue)
        date: dateStr,
        hours: record ? parseFloat(record.total_hours) : 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error("Error fetching weekly chart:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
