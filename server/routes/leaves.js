const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middleware/auth");

// --- Config Upload ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/leaves/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

const verifyAdmin = (req, res, next) => verifyToken(req, res, next);

// Helper
const calculateTotalDays = (
  startDate,
  endDate,
  startTime,
  endTime,
  isFullDay
) => {
  const parseDateTime = (dateStr, timeStr) =>
    new Date(`${dateStr}T${timeStr}:00`).getTime();
  if (isFullDay === "true" || isFullDay === true) {
    const s = parseDateTime(startDate, "00:00");
    const e = parseDateTime(endDate, "00:00");
    return Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
  } else {
    const s = parseDateTime(startDate, startTime);
    const e = parseDateTime(endDate, endTime);
    const diffHrs = (e - s) / (1000 * 60 * 60);
    return diffHrs <= 4 ? 0.5 : 1.0;
  }
};

// ==========================================
//  USER ROUTES (DO NOT TOUCH LOGIC)
// ==========================================
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();
    const [types] = await db.query("SELECT * FROM leave_types");
    const sql = `SELECT lt.id, lt.name, lt.max_per_year, COALESCE(lb.used, 0) as used, COALESCE(lb.remaining, lt.max_per_year) as remaining FROM leave_types lt LEFT JOIN leave_balance lb ON lt.id = lb.leave_type_id AND lb.user_id = ? AND lb.year = ?`;
    const [balances] = await db.query(sql, [userId, currentYear]);
    res.json({ types, balances });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// router.get("/history", verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const sql = `SELECT l.*, lt.name as leave_type_name FROM leaves l JOIN leave_types lt ON l.leave_type_id = lt.id WHERE l.user_id = ? ORDER BY l.created_at DESC`;
//     const [history] = await db.query(sql, [userId]);
//     res.json(history);
//   } catch (err) {
//     res.status(500).json({ error: "Server Error" });
//   }
// });
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Join เอา comment ล่าสุดจาก logs (Subquery หรือ Left Join)
    // เพื่อความง่าย ถ้า Log มีหลายอันเอาอันล่าสุด
    const sql = `
        SELECT l.*, lt.name as leave_type_name,
        (SELECT comment FROM leave_approval_logs WHERE leave_id = l.id ORDER BY approved_at DESC LIMIT 1) as reject_reason
        FROM leaves l 
        JOIN leave_types lt ON l.leave_type_id = lt.id 
        WHERE l.user_id = ? 
        ORDER BY l.created_at DESC
    `;
    const [history] = await db.query(sql, [userId]);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  // ... (Original User Post Logic - Keep As Is) ...
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
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

    let totalDays = 0;
    let halfDayStatus = "none";
    const parseDateTime = (dateStr, timeStr) =>
      new Date(`${dateStr}T${timeStr}:00`).getTime();

    if (isFullDay === "true" || isFullDay === true) {
      const s = parseDateTime(startDate, "00:00");
      const e = parseDateTime(endDate, "00:00");
      const diffTime = Math.abs(e - s);
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
      const s = parseDateTime(startDate, startTime);
      const e = parseDateTime(endDate, endTime);
      const diffHrs = (e - s) / (1000 * 60 * 60);
      if (diffHrs <= 4) {
        totalDays = 0.5;
        const startHour = parseInt(startTime.split(":")[0]);
        halfDayStatus = startHour < 12 ? "morning" : "afternoon";
      } else {
        totalDays = 1.0;
      }
    }

    const dbStartDate =
      isFullDay === "true"
        ? `${startDate} 00:00:00`
        : `${startDate} ${startTime}:00`;
    const dbEndDate =
      isFullDay === "true" ? `${endDate} 23:59:59` : `${endDate} ${endTime}:00`;

    const sql = `INSERT INTO leaves (user_id, leave_type_id, start_date, end_date, total_days, half_day, reason, medical_certificate_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
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
    res.json({ message: "ส่งคำขอลาเรียบร้อยแล้ว" });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: "Failed" });
  } finally {
    connection.release();
  }
});

// ==========================================
//  ADMIN ROUTES (NEW & UPDATED)
// ==========================================

// 1. GET ALL LEAVE REQUESTS (LEFT COLUMN)
router.get("/admin/requests", verifyAdmin, async (req, res) => {
  try {
    const sql = `
        SELECT l.*, lt.name as leave_type_name,
            e.name_th, e.lastname_th, e.nickname_th, e.position, e.department, e.profile_image
        FROM leaves l
        JOIN leave_types lt ON l.leave_type_id = lt.id
        JOIN users u ON l.user_id = u.id
        LEFT JOIN employees e ON u.id = e.user_id
        ORDER BY 
            CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END, 
            l.created_at DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ALL EMPLOYEES SUMMARY (RIGHT COLUMN)
router.get("/admin/summary-all", verifyAdmin, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const sql = `
        SELECT 
            u.id as user_id, 
            e.emp_code, e.name_th, e.lastname_th, e.nickname_th, 
            e.position, e.department, e.profile_image,
            COUNT(l.id) as total_leaves,
            MAX(l.created_at) as latest_leave
        FROM users u
        JOIN employees e ON u.id = e.user_id
        LEFT JOIN leaves l ON u.id = l.user_id AND YEAR(l.start_date) = ?
        GROUP BY u.id
        ORDER BY e.emp_code ASC
    `;
    const [rows] = await db.query(sql, [currentYear]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET USER FULL DETAIL (MODAL)
router.get("/admin/user/:id/full-detail", verifyAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentYear = new Date().getFullYear();

    // Quota
    const [quota] = await db.query(
      `
      SELECT lt.id, lt.name, lt.max_per_year,
      COALESCE(lb.used, 0) as used,
      COALESCE(lb.remaining, lt.max_per_year) as remaining
      FROM leave_types lt
      LEFT JOIN leave_balance lb ON lt.id = lb.leave_type_id AND lb.user_id = ? AND lb.year = ?
    `,
      [targetUserId, currentYear]
    );

    // History
    const [history] = await db.query(
      `
        SELECT l.*, lt.name as leave_type_name
        FROM leaves l
        JOIN leave_types lt ON l.leave_type_id = lt.id
        WHERE l.user_id = ? AND YEAR(l.start_date) = ?
        ORDER BY l.start_date DESC
    `,
      [targetUserId, currentYear]
    );

    res.json({ quota, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CREATE LEAVE (ADMIN)
router.post(
  "/admin/create",
  verifyAdmin,
  upload.single("file"),
  async (req, res) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const {
        targetUserId,
        leaveTypeId,
        startDate,
        endDate,
        startTime,
        endTime,
        reason,
        isFullDay,
      } = req.body;
      const totalDays = calculateTotalDays(
        startDate,
        endDate,
        startTime,
        endTime,
        isFullDay
      );
      const halfDayStatus =
        totalDays === 0.5
          ? parseInt(startTime.split(":")[0]) < 12
            ? "morning"
            : "afternoon"
          : "none";
      const dbStartDate =
        isFullDay === "true"
          ? `${startDate} 00:00:00`
          : `${startDate} ${startTime}:00`;
      const dbEndDate =
        isFullDay === "true"
          ? `${endDate} 23:59:59`
          : `${endDate} ${endTime}:00`;
      const fileUrl = req.file ? req.file.filename : null;

      await connection.query(
        `INSERT INTO leaves (user_id, leave_type_id, start_date, end_date, total_days, half_day, reason, medical_certificate_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
        [
          targetUserId,
          leaveTypeId,
          dbStartDate,
          dbEndDate,
          totalDays,
          halfDayStatus,
          reason,
          fileUrl,
        ]
      );

      // Cut Quota Logic
      const currentYear = new Date().getFullYear();
      const [checkBalance] = await connection.query(
        "SELECT id FROM leave_balance WHERE user_id = ? AND leave_type_id = ? AND year = ?",
        [targetUserId, leaveTypeId, currentYear]
      );
      if (checkBalance.length === 0) {
        const [typeInfo] = await connection.query(
          "SELECT max_per_year FROM leave_types WHERE id = ?",
          [leaveTypeId]
        );
        const max = typeInfo[0].max_per_year;
        await connection.query(
          "INSERT INTO leave_balance (user_id, leave_type_id, year, total, used, remaining) VALUES (?, ?, ?, ?, ?, ?)",
          [
            targetUserId,
            leaveTypeId,
            currentYear,
            max,
            totalDays,
            max - totalDays,
          ]
        );
      } else {
        await connection.query(
          "UPDATE leave_balance SET used = used + ?, remaining = remaining - ? WHERE id = ?",
          [totalDays, totalDays, checkBalance[0].id]
        );
      }

      await connection.commit();
      res.json({ message: "Success" });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: "Failed" });
    } finally {
      connection.release();
    }
  }
);

// 5. UPDATE STATUS (ADMIN)
router.put("/:id/status", verifyAdmin, async (req, res) => {
  const leaveId = req.params.id;
  const { status, comment } = req.body; // รับ comment มาด้วย
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [leaveData] = await connection.query(
      "SELECT * FROM leaves WHERE id = ?",
      [leaveId]
    );
    if (leaveData.length === 0) throw new Error("Not Found");
    const leaveRequest = leaveData[0];

    // Update Main Table
    await connection.query("UPDATE leaves SET status = ? WHERE id = ?", [
      status,
      leaveId,
    ]);

    // Insert Log with Comment
    await connection.query(
      "INSERT INTO leave_approval_logs (leave_id, approver_id, status, comment, approval_level) VALUES (?, ?, ?, ?, 1)",
      [leaveId, req.user.id, status, comment || null]
    );

    // Refund Quota Logic (ถ้า Reject แล้วใบลาเดิมตัดโควต้าไปแล้ว ต้องคืน)
    // สมมติว่าระบบตัดตั้งแต่ตอนขอ (Pending) ถ้า Reject ต้องคืน
    if (status === "rejected" && leaveRequest.status === "pending") {
      const currentYear = new Date().getFullYear();
      await connection.query(
        `UPDATE leave_balance SET used = used - ?, remaining = remaining + ? WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
        [
          leaveRequest.total_days,
          leaveRequest.total_days,
          leaveRequest.user_id,
          leaveRequest.leave_type_id,
          currentYear,
        ]
      );
    }
    await connection.commit();
    res.json({ message: `Status updated` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: "Error" });
  } finally {
    connection.release();
  }
});

// 6. GET USERS FOR DROPDOWN
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const sql = `SELECT u.id as user_id, e.emp_code, e.name_th, e.lastname_th, e.nickname_th, e.position FROM employees e JOIN users u ON e.user_id = u.id ORDER BY e.name_th ASC`;
    const [users] = await db.query(sql);
    // Format for SearchableDropdown
    res.json(
      users.map((u) => ({
        value: u.user_id,
        label: `${u.name_th} ${u.lastname_th}`,
        subLabel: `${u.position}`,
        code: u.emp_code,
        nickname: u.nickname_th,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
