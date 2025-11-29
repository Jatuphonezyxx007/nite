// server/index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- 1. Import Routes ---
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const attendanceRoutes = require("./routes/attendance");
const userRoutes = require("./routes/users"); // <--- ✅ เพิ่มบรรทัดนี้

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- 2. Use Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/user", userRoutes); // <--- ✅ เพิ่มบรรทัดนี้ (สำคัญมาก)

// หมายเหตุ:
// Frontend เรียก: /api/user/dashboard-stats
// app.use("/api/user") จะจับคู่กับ router.get("/dashboard-stats") ใน users.js
// รวมกันเป็น /api/user/dashboard-stats พอดีครับ

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
