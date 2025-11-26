// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const verifyAdmin = (req, res, next) => {
//   const token = req.headers["authorization"]?.split(" ")[1];
//   if (!token) return res.status(403).send("Token required");
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
//     if (decoded.role !== "admin")
//       return res.status(403).send("Admin access only");
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).send("Invalid Token");
//   }
// };

// // 1. ดึงรายชื่อพนักงานทั้งหมด
// // router.get("/users", verifyAdmin, async (req, res) => {
// //   try {
// //     const [users] = await db.query("SELECT * FROM users");
// //     res.json(users);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });
// router.get("/users", verifyAdmin, async (req, res) => {
//   try {
//     // รับค่า query parameter ชื่อ 'deleted' มาจาก Frontend
//     // ถ้าส่งมาเป็น 'true' ให้ดึงคนที่ถูกลบ ถ้าไม่ส่งมา ให้ดึงคนปกติ
//     const showDeleted = req.query.deleted === "true";

//     let sql;
//     if (showDeleted) {
//       // ดึงเฉพาะคนที่ถูก Soft Delete ไปแล้ว
//       sql =
//         "SELECT * FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC";
//     } else {
//       // ดึงเฉพาะคนปกติ (ค่า default)
//       sql = "SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id ASC";
//     }

//     const [users] = await db.query(sql);
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. เพิ่มพนักงานใหม่
// router.post("/users", verifyAdmin, async (req, res) => {
//   const { name, email, password, role, position } = req.body;
//   try {
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(password, salt);
//     await db.query(
//       "INSERT INTO users (name, email, password_hash, role, position) VALUES (?, ?, ?, ?, ?)",
//       [name, email, hash, role || "user", position]
//     );
//     res.json({ message: "User created successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. ลบพนักงาน (ห้ามลบตัวเอง)
// // router.delete("/users/:id", verifyAdmin, async (req, res) => {
// //   const targetId = req.params.id;
// //   if (parseInt(targetId) === req.user.id)
// //     return res.status(400).json({ message: "Cannot delete yourself" });

// //   try {
// //     await db.query("DELETE FROM users WHERE id = ?", [targetId]);
// //     res.json({ message: "User deleted" });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });
// router.delete("/users/:id", verifyAdmin, async (req, res) => {
//   const targetId = req.params.id;

//   // ป้องกันการลบตัวเอง
//   if (parseInt(targetId) === req.user.id)
//     return res.status(400).json({ message: "Cannot delete yourself" });

//   try {
//     // เปลี่ยนจาก DELETE FROM... เป็น UPDATE...
//     const sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?";

//     await db.query(sql, [targetId]);
//     res.json({ message: "User soft deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. แก้ไขข้อมูลพนักงาน (Update User)
// router.put("/users/:id", verifyAdmin, async (req, res) => {
//   const userId = req.params.id;
//   // ดึงค่าจาก body (รองรับทั้งแบบ JSON และ FormData)
//   const {
//     prefix_th,
//     name_th,
//     lastname_th,
//     nickname_th,
//     prefix_en,
//     name_en,
//     lastname_en,
//     nickname_en,
//     email,
//     password,
//     role,
//     position,
//   } = req.body;

//   try {
//     // 1. เตรียม Query พื้นฐาน
//     let sql = `
//       UPDATE users SET
//       prefix_th=?, name_th=?, lastname_th=?, nickname_th=?,
//       prefix_en=?, name_en=?, lastname_en=?, nickname_en=?,
//       email=?, role=?, position=?, updated_at=NOW()
//     `;

//     // เตรียม Values ตามลำดับ
//     let values = [
//       prefix_th,
//       name_th,
//       lastname_th,
//       nickname_th,
//       prefix_en,
//       name_en,
//       lastname_en,
//       nickname_en,
//       email,
//       role,
//       position,
//     ];

//     // 2. เช็คว่ามีการเปลี่ยนรหัสผ่านไหม? (ถ้าส่งมาว่างๆ แปลว่าไม่เปลี่ยน)
//     if (password && password.trim() !== "") {
//       const salt = await bcrypt.genSalt(10);
//       const hash = await bcrypt.hash(password, salt);
//       sql += `, password_hash=?`;
//       values.push(hash);
//     }

//     // 3. เช็คว่ามีการอัปโหลดรูปใหม่ไหม? (ถ้ามี req.file)
//     // หมายเหตุ: ตรงนี้สมมติว่าคุณใช้ multer middleware ใน server.js แล้ว
//     if (req.file) {
//       sql += `, profile_image=?`;
//       values.push(req.file.filename);
//     }

//     // 4. จบ Query ด้วย WHERE
//     sql += ` WHERE id=?`;
//     values.push(userId);

//     // 5. รันคำสั่ง
//     await db.query(sql, values);

//     res.json({ message: "User updated successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // 4. Dashboard Stats (Real-time Attendance)
// router.get("/stats", verifyAdmin, async (req, res) => {
//   try {
//     const today = new Date().toISOString().split("T")[0];
//     const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users");
//     const [presentToday] = await db.query(
//       "SELECT COUNT(*) as count FROM attendance WHERE date = ?",
//       [today]
//     );
//     const [lateToday] = await db.query(
//       "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'late'",
//       [today]
//     );

//     // ดึงรายการคนเข้างานวันนี้ล่าสุด 5 คน
//     const [recent] = await db.query(
//       `
//             SELECT a.*, u.name
//             FROM attendance a
//             JOIN users u ON a.user_id = u.id
//             WHERE a.date = ?
//             ORDER BY a.clock_in DESC LIMIT 5`,
//       [today]
//     );

//     res.json({
//       totalUsers: totalUsers[0].count,
//       present: presentToday[0].count,
//       late: lateToday[0].count,
//       recentActivity: recent,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Config Multer สำหรับอัปโหลดรูปภาพ ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ตรวจสอบว่ามีโฟลเดอร์ uploads/profile หรือไม่ ถ้าไม่มีให้สร้าง
    const dir = "uploads/profile/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // ตั้งชื่อไฟล์ใหม่ป้องกันชื่อซ้ำ: user-{timestamp}-{random}.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "user-" + uniqueSuffix + path.extname(file.originalname).toLowerCase()
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาด 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, webp) เท่านั้น!"));
  },
});

// Middleware ตรวจสอบ Admin
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

// 1. ดึงรายชื่อพนักงานทั้งหมด
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const showDeleted = req.query.deleted === "true";
    let sql;
    if (showDeleted) {
      sql =
        "SELECT * FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC";
    } else {
      sql = "SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id ASC";
    }
    const [users] = await db.query(sql);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. เพิ่มพนักงานใหม่ (Create)
router.post(
  "/users",
  verifyAdmin,
  upload.single("profile_image"),
  async (req, res) => {
    const {
      prefix_th,
      name_th,
      lastname_th,
      nickname_th,
      prefix_en,
      name_en,
      lastname_en,
      nickname_en,
      email,
      password,
      role,
      position,
    } = req.body;

    // รับชื่อไฟล์รูปภาพ (ถ้ามี)
    const profile_image = req.file ? req.file.filename : null;

    try {
      // Hash Password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const sql = `
      INSERT INTO users 
      (prefix_th, name_th, lastname_th, nickname_th, prefix_en, name_en, lastname_en, nickname_en, email, password_hash, role, position, profile_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      await db.query(sql, [
        prefix_th,
        name_th,
        lastname_th,
        nickname_th,
        prefix_en,
        name_en,
        lastname_en,
        nickname_en,
        email,
        hash,
        role || "user",
        position,
        profile_image,
      ]);

      res.json({ message: "User created successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 3. แก้ไขข้อมูลพนักงาน (Update)
router.put(
  "/users/:id",
  verifyAdmin,
  upload.single("profile_image"),
  async (req, res) => {
    const userId = req.params.id;
    const {
      prefix_th,
      name_th,
      lastname_th,
      nickname_th,
      prefix_en,
      name_en,
      lastname_en,
      nickname_en,
      email,
      password, // อาจจะว่างถ้าไม่เปลี่ยน
      role,
      position,
    } = req.body;

    try {
      let updateFields = [];
      let updateValues = [];

      // Helper function เพื่อเพิ่ม field ที่ต้องการอัปเดต
      const addField = (field, value) => {
        if (value !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      };

      // เพิ่ม field ปกติ
      addField("prefix_th", prefix_th);
      addField("name_th", name_th);
      addField("lastname_th", lastname_th);
      addField("nickname_th", nickname_th);
      addField("prefix_en", prefix_en);
      addField("name_en", name_en);
      addField("lastname_en", lastname_en);
      addField("nickname_en", nickname_en);
      addField("email", email);
      addField("role", role);
      addField("position", position);

      // จัดการ Password (ถ้ามีการส่งมาใหม่ให้ Hash ใหม่)
      if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        updateFields.push("password_hash = ?");
        updateValues.push(hash);
      }

      // จัดการรูปภาพ (ถ้ามีการอัปโหลดไฟล์ใหม่)
      if (req.file) {
        updateFields.push("profile_image = ?");
        updateValues.push(req.file.filename);
        // Note: จริงๆ ควรลบรูปเก่าทิ้งด้วยเพื่อประหยัดพื้นที่
      }

      // ถ้าไม่มีอะไรอัปเดตเลย
      if (updateFields.length === 0) {
        return res.json({ message: "No changes provided" });
      }

      // เพิ่ม updated_at
      updateFields.push("updated_at = NOW()");

      // ต่อ SQL query
      const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
      updateValues.push(userId);

      await db.query(sql, updateValues);

      res.json({ message: "User updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// 4. ลบพนักงาน (Soft Delete)
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  const targetId = req.params.id;
  if (parseInt(targetId) === req.user.id)
    return res.status(400).json({ message: "Cannot delete yourself" });

  try {
    const sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?";
    await db.query(sql, [targetId]);
    res.json({ message: "User soft deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Dashboard Stats
router.get("/stats", verifyAdmin, async (req, res) => {
  /* ... (code เดิม) ... */
  try {
    const today = new Date().toISOString().split("T")[0];
    const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users");
    const [presentToday] = await db.query(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ?",
      [today]
    );
    const [lateToday] = await db.query(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'late'",
      [today]
    );

    // ดึงรายการคนเข้างานวันนี้ล่าสุด 5 คน (join เพื่อเอาชื่อ)
    const [recent] = await db.query(
      `
            SELECT a.*, u.name_th 
            FROM attendance a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.date = ? 
            ORDER BY a.clock_in DESC LIMIT 5`,
      [today]
    );

    res.json({
      totalUsers: totalUsers[0].count,
      present: presentToday[0].count,
      late: lateToday[0].count,
      recentActivity: recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
