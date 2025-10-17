// backend/routes/email.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer");

// ✅ Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "asg60738@gmail.com",
    pass: "ghiw ajcf bdyn weka",
  },
});

// ✅ Email subscription route
router.post("/subscribe", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const query = "INSERT INTO email_subscribers (email) VALUES (?)";
  db.query(query, [email], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Email already subscribed" });
      }
      return res.status(500).json({ message: "Error saving email" });
    }

    const mailOptions = {
      from: "asg60738@gmail.com",
      to: email,
      subject: "Welcome to Eco Updates 🌱",
      text: "Thanks for subscribing! You'll receive daily tips to live more sustainably.",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log("❌ Email error:", error);
      else console.log("✅ Welcome email sent:", info.response);
    });

    res.json({ message: "Subscribed successfully and email sent!" });
  });
});

module.exports = router;
