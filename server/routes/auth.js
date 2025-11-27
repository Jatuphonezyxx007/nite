const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name_th: user.name_th,
        lastname_th: user.lastname_th,
        profile_image: user.profile_image,
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "5h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name_th: user.name_th,
        lastname_th: user.lastname_th,
        nickname_th: user.nickname_th,
        name_en: user.name_en,
        lastname_en: user.lastname_en,
        nickname_en: user.nickname_en,
        role: user.role,
        email: user.email,
        profile_image: user.profile_image,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
