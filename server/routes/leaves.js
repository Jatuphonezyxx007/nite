const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middleware/auth"); // ใช้ Middleware เดิมของคุณ

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// GET /api/leaves/summary - ดึงประเภทการลาและวันลาคงเหลือ
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    // 1. ดึงประเภทการลาทั้งหมด
    const [types] = await db.query("SELECT * FROM leave_types");

    // 2. ดึงยอดคงเหลือของ User (JOIN กับ leave_types เพื่อให้ได้ข้อมูลครบแม้ยังไม่มี record ใน balance)
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

// GET /api/leaves/history - ดึงประวัติการลา
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

// POST /api/leaves - สร้างใบลาใหม่
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
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

    // --- คำนวณจำนวนวัน (Logic เบื้องต้น) ---
    let totalDays = 0;
    let halfDayStatus = "none";

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isFullDay === "true") {
      // นับวัน: (จบ - เริ่ม) / milliseconds_per_day + 1
      const diffTime = Math.abs(end - start);
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
      // กรณีระบุเวลา (คำนวณเป็นชั่วโมงแล้วแปลงเป็นวัน หรือใช้ Logic Half Day)
      // สมมติ: ถ้า <= 4 ชั่วโมง = 0.5 วัน, ถ้า > 4 ชั่วโมง = 1 วัน
      // หมายเหตุ: Logic นี้ควรปรับตามกฏบริษัทจริง
      const startDT = new Date(`${startDate}T${startTime}`);
      const endDT = new Date(`${endDate}T${endTime}`);
      const diffHrs = (endDT - startDT) / (1000 * 60 * 60);

      if (diffHrs <= 4) {
        totalDays = 0.5;
        // เดาว่าเป็นเช้าหรือบ่ายจากเวลาเริ่ม (เช่น เริ่มก่อน 12:00 คือเช้า)
        halfDayStatus =
          parseInt(startTime.split(":")[0]) < 12 ? "morning" : "afternoon";
      } else {
        totalDays = 1.0; // หรือคำนวณตามจริงถ้าข้ามวัน
      }
    }

    // --- ตรวจสอบโควต้า (Optional: ควรทำใน Production) ---
    // ... logic ตรวจสอบ leave_balance ...

    // --- บันทึกข้อมูล ---
    const sql = `
      INSERT INTO leaves 
      (user_id, leave_type_id, start_date, end_date, total_days, half_day, reason, medical_certificate_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    await connection.query(sql, [
      userId,
      leaveTypeId,
      startDate,
      endDate,
      totalDays,
      halfDayStatus,
      reason,
      fileUrl,
    ]);

    // Update Balance (Used/Remaining) - อัปเดตทันทีหรือรออนุมัติแล้วค่อยอัปเดตก็ได้
    // ในที่นี้สมมติว่าตัดโควต้าเลย (Pending)
    const currentYear = new Date().getFullYear();

    // ตรวจสอบว่ามี row ใน balance หรือยัง
    const [checkBalance] = await connection.query(
      "SELECT id FROM leave_balance WHERE user_id = ? AND leave_type_id = ? AND year = ?",
      [userId, leaveTypeId, currentYear]
    );

    if (checkBalance.length === 0) {
      // ถ้ายังไม่มี ให้ Insert ใหม่ (ดึง Max จาก Type มาตั้งต้น)
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
      // ถ้ามีแล้ว Update
      await connection.query(
        "UPDATE leave_balance SET used = used + ?, remaining = remaining - ? WHERE id = ?",
        [totalDays, totalDays, checkBalance[0].id]
      );
    }

    await connection.commit();
    res.json({ message: "ส่งคำขอลาเรียบร้อยแล้ว" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create leave request" });
  } finally {
    connection.release();
  }
});

module.exports = router;
