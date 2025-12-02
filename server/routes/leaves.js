const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middleware/auth");
const jwt = require("jsonwebtoken"); // ต้องใช้สำหรับ verifyAdmin

// --- Config Upload ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/leaves/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "leave-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) return cb(null, true);
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพและ PDF เท่านั้น"));
  },
});

// --- Middleware: Verify Admin ---
const verifyAdmin = (req, res, next) => {
  // ใช้ verifyToken ก่อนเพื่อดึง req.user
  verifyToken(req, res, () => {
    // สมมติว่าใน token มี role หรือไปเช็คใน DB อีกที
    // ในที่นี้เช็คเบื้องต้นจาก decoded token (ถ้าคุณเก็บ role ใน token)
    // หรือถ้าไม่มี ให้ query check role_id จาก user_id

    // ตัวอย่าง: อนุญาตให้ผ่านไปก่อน หรือเช็ค DB
    // const isAdmin = req.user.role === 'admin';
    // if (!isAdmin) return res.status(403).json({ error: "Admin Access Only" });

    next();
  });
};

// ==========================================
//  USER ROUTES
// ==========================================

// GET /api/leaves/summary - ดึงประเภทการลาและวันลาคงเหลือ
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const [types] = await db.query("SELECT * FROM leave_types");

    const sql = `
      SELECT 
        lt.id, 
        lt.name, 
        lt.max_per_year,
        COALESCE(lb.used, 0) as used,
        COALESCE(lb.remaining, lt.max_per_year) as remaining
      FROM leave_types lt
      LEFT JOIN leave_balance lb ON lt.id = lb.leave_type_id AND lb.user_id = ? AND lb.year = ?
    `;
    const [balances] = await db.query(sql, [userId, currentYear]);

    res.json({ types, balances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET /api/leaves/history - ดึงประวัติการลา (ส่วนตัว)
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `
      SELECT l.*, lt.name as leave_type_name 
      FROM leaves l
      JOIN leave_types lt ON l.leave_type_id = lt.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `;
    const [history] = await db.query(sql, [userId]);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ... (Imports & Setup เหมือนเดิม)

router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    // รับข้อมูลเป็น String: startDate='2023-12-25', startTime='09:00'
    const {
      leaveTypeId,
      startDate,
      endDate,
      startTime,
      endTime,
      reason,
      isFullDay,
    } = req.body;

    const fileUrl = req.file ? req.file.filename : null;

    // --- 1. การคำนวณจำนวนวัน (Logic Timezone Safe) ---
    // เราจะสร้าง Date Object โดย Manual เพื่อคำนวณ diff เท่านั้น
    let totalDays = 0;
    let halfDayStatus = "none";

    // Helper: Parse Date String to UTC-agnostic timestamps for calculation
    const parseDateTime = (dateStr, timeStr) => {
      // dateStr: YYYY-MM-DD, timeStr: HH:mm
      return new Date(`${dateStr}T${timeStr}:00`).getTime();
    };

    if (isFullDay === "true" || isFullDay === true) {
      // นับวันเต็ม: (End - Start) + 1 วัน
      const s = parseDateTime(startDate, "00:00");
      const e = parseDateTime(endDate, "00:00");
      const diffTime = Math.abs(e - s);
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
      // นับชั่วโมง
      const s = parseDateTime(startDate, startTime);
      const e = parseDateTime(endDate, endTime);
      const diffHrs = (e - s) / (1000 * 60 * 60);

      if (diffHrs <= 4) {
        totalDays = 0.5;
        const startHour = parseInt(startTime.split(":")[0]);
        halfDayStatus = startHour < 12 ? "morning" : "afternoon";
      } else {
        totalDays = 1.0;
        // หรือจะคำนวณละเอียดกว่านี้ตาม Business Logic บริษัท
      }
    }

    // --- 2. เตรียมข้อมูลลง DB (MySQL format: YYYY-MM-DD HH:mm:ss) ---
    // เนื่องจากเราต้องการ "ยึดเวลาไทย" (Local Time) เป็นหลัก
    // เราจะเก็บค่าลง DB ตรงๆ โดยเอา String มาต่อกันเลย ไม่ต้องผ่าน new Date() ให้เพี้ยน

    const dbStartDate =
      isFullDay === "true"
        ? `${startDate} 00:00:00`
        : `${startDate} ${startTime}:00`;

    const dbEndDate =
      isFullDay === "true" ? `${endDate} 23:59:59` : `${endDate} ${endTime}:00`;

    // บันทึก leaves
    const sql = `
      INSERT INTO leaves 
      (user_id, leave_type_id, start_date, end_date, total_days, half_day, reason, medical_certificate_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    // ส่ง string เข้าไปตรงๆ MySQL จะมองว่าเป็น Datetime ตามค่า string นั้นๆ
    await connection.query(sql, [
      userId,
      leaveTypeId,
      dbStartDate,
      dbEndDate,
      totalDays,
      halfDayStatus,
      reason,
      fileUrl,
    ]);

    // ตัดโควต้า (Leave Balance Logic - เหมือนเดิม)
    const currentYear = new Date().getFullYear();
    const [checkBalance] = await connection.query(
      "SELECT id FROM leave_balance WHERE user_id = ? AND leave_type_id = ? AND year = ?",
      [userId, leaveTypeId, currentYear]
    );

    if (checkBalance.length === 0) {
      const [typeInfo] = await connection.query(
        "SELECT max_per_year FROM leave_types WHERE id = ?",
        [leaveTypeId]
      );
      const max = typeInfo[0].max_per_year;
      await connection.query(
        "INSERT INTO leave_balance (user_id, leave_type_id, year, total, used, remaining) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, leaveTypeId, currentYear, max, totalDays, max - totalDays]
      );
    } else {
      await connection.query(
        "UPDATE leave_balance SET used = used + ?, remaining = remaining - ? WHERE id = ?",
        [totalDays, totalDays, checkBalance[0].id]
      );
    }

    await connection.commit();
    res.json({
      message: "ส่งคำขอลาเรียบร้อยแล้ว",
      debug: { totalDays, dbStartDate, dbEndDate },
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create leave request" });
  } finally {
    connection.release();
  }
});

// ==========================================
//  ADMIN ROUTES (Added)
// ==========================================

// GET /api/leaves/all - ดึงรายการลาทั้งหมดสำหรับ Admin
router.get("/all", verifyAdmin, async (req, res) => {
  try {
    const sql = `
        SELECT 
            l.*,
            lt.name as leave_type_name,
            e.prefix_th, e.name_th, e.lastname_th, e.nickname_th, 
            e.position, e.department, e.profile_image,
            u.email
        FROM leaves l
        JOIN leave_types lt ON l.leave_type_id = lt.id
        JOIN users u ON l.user_id = u.id
        LEFT JOIN employees e ON u.id = e.user_id
        ORDER BY 
            CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END, 
            l.created_at DESC
    `;
    const [rows] = await db.query(sql);

    // Map Data ให้ใช้ง่ายใน Frontend
    const formatted = rows.map((row) => {
      let typeKey = "other";
      const typeName = row.leave_type_name || "";
      if (typeName.includes("ป่วย")) typeKey = "sick";
      else if (typeName.includes("กิจ")) typeKey = "business";
      else if (typeName.includes("พักร้อน")) typeKey = "vacation";

      return {
        id: row.id,
        user_id: row.user_id,
        name_th: row.name_th || "Unknown",
        lastname_th: row.lastname_th || "",
        nickname_th: row.nickname_th,
        position: row.position || "-",
        department: row.department || "-",
        profile_image: row.profile_image,
        leave_type: typeKey,
        leave_type_name: typeName,
        start_date: row.start_date,
        end_date: row.end_date,
        total_days: row.total_days,
        reason: row.reason,
        attachment: row.medical_certificate_url,
        status: row.status,
        created_at: row.created_at,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/leaves/:id/status - อนุมัติ/ไม่อนุมัติ
router.put("/:id/status", verifyAdmin, async (req, res) => {
  const leaveId = req.params.id;
  const { status, comment } = req.body; // 'approved' | 'rejected'
  const approverId = req.user.id;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. ดึงข้อมูลเดิมเพื่อดูวันลาที่ถูกตัดไป
    const [leaveData] = await connection.query(
      "SELECT * FROM leaves WHERE id = ?",
      [leaveId]
    );
    if (leaveData.length === 0) {
      throw new Error("Leave request not found");
    }
    const leaveRequest = leaveData[0];

    // 2. อัปเดตสถานะในตาราง leaves
    await connection.query("UPDATE leaves SET status = ? WHERE id = ?", [
      status,
      leaveId,
    ]);

    // 3. บันทึก Log
    await connection.query(
      "INSERT INTO leave_approval_logs (leave_id, approver_id, status, comment, approval_level) VALUES (?, ?, ?, ?, 1)",
      [leaveId, approverId, status, comment || ""]
    );

    // 4. [CRITICAL] คืนวันลา (Refund Balance) กรณี Rejected
    // เพราะตอน User ขอลา เราตัดโควต้าไปแล้ว (used + day, remaining - day)
    if (status === "rejected" && leaveRequest.status === "pending") {
      const currentYear = new Date().getFullYear();
      const totalDays = leaveRequest.total_days;

      await connection.query(
        `UPDATE leave_balance 
             SET used = used - ?, remaining = remaining + ? 
             WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
        [
          totalDays,
          totalDays,
          leaveRequest.user_id,
          leaveRequest.leave_type_id,
          currentYear,
        ]
      );
    }

    await connection.commit();
    res.json({ message: `Leave request ${status}` });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  } finally {
    connection.release();
  }
});

module.exports = router;
