const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const analyzerRoutes = require('./server');
const communityRoutes = require('./routes/community');
const authRoutes = require('./routes/auth'); 
const emailRoutes = require('./routes/email'); 
const app = express();
const PORT = 5000;

// DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dee_chethu',
  database: 'ecopick'
});
// Force-set CORS headers (TEMPORARY FOR DEBUG)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL Connection Error:', err);
    process.exit(1);
  } else {
    console.log('✅ MySQL connected successfully');
  }
});
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'eco-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', communityRoutes);
app.use('/api', authRoutes);
app.use('/api', emailRoutes);

// Login Route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) {
      console.error('🔥 DB ERROR:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      req.session.user = results[0];
      return res.status(200).json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

// Session Check
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ user: req.session.user });
  } else {
    return res.status(401).json({ message: 'Not logged in' });
  }
});

// Logout
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

//ANALYZER ROUTES

app.use('/api', analyzerRoutes);

const cron = require('node-cron');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "asg60738@gmail.com",
    pass: "ghiw ajcf bdyn weka",
  },
});

cron.schedule("0 9 * * *", () => {
  console.log("⏰ Sending daily eco tips...");

  db.query("SELECT email FROM email_subscribers", (err, results) => {
    if (err) return console.error("DB read error:", err);

    results.forEach((row) => {
      const mailOptions = {
        from: "asg60738@gmail.com",
        to: row.email,
        subject: "🌿 Daily Eco Tip",
        text: "Today's tip: Turn off lights when you leave the room 🌍",
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("❌ Failed to send to", row.email, error);
        else console.log("✅ Sent to", row.email);
      });
    });
  });
});
const multer = require('multer');

// Configure multer for storing uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Upload profile picture route
app.post('/api/upload-profile-pic', upload.single('profilePic'), (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  const userId = req.session.user.id;
  const profilePic = req.file.filename;

  db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profilePic, userId], (err) => {
    if (err) {
      console.error('❌ DB update error:', err);
      return res.status(500).json({ message: 'Failed to update profile picture' });
    }
    // Update session data so frontend gets new image
    req.session.user.profile_pic = profilePic;

    return res.status(200).json({
      message: 'Profile picture updated successfully',
      user: req.session.user
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});