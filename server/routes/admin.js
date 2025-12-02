const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Config Multer (เหมือนเดิม) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/profile/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "user-" + uniqueSuffix + path.extname(file.originalname).toLowerCase()
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) return cb(null, true);
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, webp) เท่านั้น!"));
  },
});

// --- Middleware ---
const verifyAdmin = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).send("Token required");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin")
      return res.status(403).send("Admin access only");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send("Invalid Token");
  }
};

// ==========================================
// 1. ดึงรายชื่อพนักงานทั้งหมด (JOIN users + employees + role)
// ==========================================
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const showDeleted = req.query.deleted === "true";
    let sql = `
      SELECT 
        u.id, u.id AS user_id, u.username, u.email, u.role_id,
        r.name AS role_name,
        e.id AS emp_id, e.emp_code, 
        e.prefix_th, e.name_th, e.lastname_th, e.nickname_th,
        e.prefix_en, e.name_en, e.lastname_en, e.nickname_en,
        e.position, e.department, e.phone, e.profile_image, 
        e.hire_date
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN role r ON u.role_id = r.id
    `;

    if (showDeleted) {
      sql += " WHERE u.deleted_at IS NOT NULL ORDER BY u.deleted_at DESC";
    } else {
      sql += " WHERE u.deleted_at IS NULL ORDER BY u.id ASC";
    }

    const [users] = await db.query(sql);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. เพิ่มพนักงานใหม่ (Transaction: Users -> Employees)
// ==========================================
router.post(
  "/users",
  verifyAdmin,
  upload.single("profile_image"),
  async (req, res) => {
    const connection = await db.getConnection(); // เริ่ม Transaction
    try {
      await connection.beginTransaction();

      const {
        username,
        password,
        email,
        role_id, // ส่วนของ Users
        emp_code,
        prefix_th,
        name_th,
        lastname_th,
        nickname_th, // ส่วนของ Employees
        prefix_en,
        name_en,
        lastname_en,
        nickname_en,
        position,
        department,
        phone,
      } = req.body;

      const profile_image = req.file ? req.file.filename : "";

      // 2.1 Hash Password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      // 2.2 Insert into `users` table
      const [userResult] = await connection.query(
        `INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)`,
        [username, email, hash, role_id || 2] // Default role_id 2 (User)
      );
      const newUserId = userResult.insertId;

      // 2.3 Insert into `employees` table
      const sqlEmployee = `
      INSERT INTO employees 
      (user_id, emp_code, prefix_th, name_th, lastname_th, nickname_th, 
       prefix_en, name_en, lastname_en, nickname_en, 
       position, department, phone, profile_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      await connection.query(sqlEmployee, [
        newUserId,
        emp_code,
        prefix_th,
        name_th,
        lastname_th,
        nickname_th || "",
        prefix_en,
        name_en,
        lastname_en,
        nickname_en || "",
        position,
        department,
        phone,
        profile_image,
      ]);

      await connection.commit(); // ยืนยันข้อมูลลง DB
      res.json({
        message: "User & Employee profile created successfully",
        userId: newUserId,
      });
    } catch (err) {
      await connection.rollback(); // ถ้าพัง ให้ยกเลิกทั้งหมด
      console.error("Create User Error:", err);
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
  }
);

// ==========================================
// 3. แก้ไขข้อมูล (Update Transaction)
// ==========================================
router.put(
  "/users/:id",
  verifyAdmin,
  upload.single("profile_image"),
  async (req, res) => {
    const userId = req.params.id;
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        username,
        email,
        role_id,
        password, // Users
        emp_code,
        prefix_th,
        name_th,
        lastname_th,
        nickname_th, // Employees
        prefix_en,
        name_en,
        lastname_en,
        nickname_en,
        position,
        department,
        phone,
      } = req.body;

      // 3.1 Update `users` table
      let userUpdates = [];
      let userValues = [];

      if (username) {
        userUpdates.push("username = ?");
        userValues.push(username);
      }
      if (email) {
        userUpdates.push("email = ?");
        userValues.push(email);
      }
      if (role_id) {
        userUpdates.push("role_id = ?");
        userValues.push(role_id);
      }
      if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        userUpdates.push("password_hash = ?");
        userValues.push(hash);
      }

      if (userUpdates.length > 0) {
        userValues.push(userId);
        await connection.query(
          `UPDATE users SET ${userUpdates.join(", ")} WHERE id = ?`,
          userValues
        );
      }

      // 3.2 Update `employees` table
      let empUpdates = [];
      let empValues = [];

      const addEmpField = (field, val) => {
        if (val !== undefined) {
          // เช็ค undefined เพราะบางทีส่งค่าว่างมาคือการลบ
          empUpdates.push(`${field} = ?`);
          empValues.push(val);
        }
      };

      addEmpField("emp_code", emp_code);
      addEmpField("prefix_th", prefix_th);
      addEmpField("name_th", name_th);
      addEmpField("lastname_th", lastname_th);
      addEmpField("nickname_th", nickname_th);
      addEmpField("prefix_en", prefix_en);
      addEmpField("name_en", name_en);
      addEmpField("lastname_en", lastname_en);
      addEmpField("nickname_en", nickname_en);
      addEmpField("position", position);
      addEmpField("department", department);
      addEmpField("phone", phone);

      if (req.file) {
        empUpdates.push("profile_image = ?");
        empValues.push(req.file.filename);
      }

      if (empUpdates.length > 0) {
        empValues.push(userId); // WHERE user_id = ?
        await connection.query(
          `UPDATE employees SET ${empUpdates.join(", ")} WHERE user_id = ?`,
          empValues
        );
      }

      await connection.commit();
      res.json({ message: "User updated successfully" });
    } catch (err) {
      await connection.rollback();
      console.error("Update Error:", err);
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
  }
);

// ==========================================
// 4. ลบพนักงาน (Soft Delete users table)
// ==========================================
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  const targetId = req.params.id;

  if (parseInt(targetId) === req.user.id) {
    return res.status(400).json({ message: "ไม่สามารถลบบัญชีตัวเองได้" });
  }

  try {
    // Soft delete แค่ users ก็พอ เพราะระบบ Login เช็คที่ users เป็นหลัก
    // แต่ถ้าอยากให้เนียน ก็ Update employees.deleted_at ด้วยก็ได้
    await db.query("UPDATE users SET deleted_at = NOW() WHERE id = ?", [
      targetId,
    ]);
    await db.query(
      "UPDATE employees SET deleted_at = NOW() WHERE user_id = ?",
      [targetId]
    );

    res.json({ message: "User soft deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. Dashboard Stats (ปรับให้ตรงกับ Table จริง)
// ==========================================
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Total Active Users
    const [totalUsers] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL"
    );

    // 2. Present Today
    const [presentToday] = await db.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = ?",
      [today]
    );

    // 3. Late Today
    const [lateToday] = await db.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = ? AND status = 'late'",
      [today]
    );

    // 4. Recent Logs (Join เพื่อเอาชื่อมาแสดง)
    const [recent] = await db.query(
      `
      SELECT a.*, e.name_th, e.lastname_th, e.profile_image, e.emp_code
      FROM attendance a
      JOIN employees e ON a.user_id = e.user_id
      WHERE a.date = ?
      ORDER BY a.clock_in DESC
      LIMIT 5
    `,
      [today]
    );

    res.json({
      totalUsers: totalUsers[0].count,
      present: presentToday[0].count,
      late: lateToday[0].count,
      recentActivity: recent,
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Master Data (สำหรับ Dropdown ในหน้า Admin)
// ==========================================
router.get("/master-data", verifyAdmin, async (req, res) => {
  try {
    const [roles] = await db.query("SELECT * FROM role ORDER BY id ASC");
    const [positions] = await db.query(
      "SELECT * FROM positions ORDER BY name_th ASC"
    );
    const [sections] = await db.query(
      "SELECT * FROM sections ORDER BY name_th ASC"
    );

    res.json({ roles, positions, sections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
