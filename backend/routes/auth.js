
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// SIGNUP with profile picture
router.post('/signup', upload.single('profilePic'), (req, res) => {
  const { name, email, password } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  db.query(
    'INSERT INTO users (name, email, password, profile_pic) VALUES (?, ?, ?, ?)',
    [name, email, password, profilePic],
    (err) => {
      if (err) {
        console.error('Signup Error:', err);
        return res.status(500).json({ message: 'Signup failed' });
      }
      res.json({ message: 'Signup successful' });
    }
  );
});
module.exports=router;