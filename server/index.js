require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Import Routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const attendanceRoutes = require("./routes/attendance");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
