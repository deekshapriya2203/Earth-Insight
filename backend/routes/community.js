const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/community-post', upload.single('image'), async (req, res) => {
  const { caption, community } = req.body;
  let imagePath = null;

  try {
    if (req.file) {
      const resizedPath = path.join(uploadDir, 'resized-' + req.file.filename);
      await sharp(req.file.path).resize(600).jpeg({ quality: 70 }).toFile(resizedPath);
      fs.unlinkSync(req.file.path); // Remove original
      imagePath = '/uploads/' + path.basename(resizedPath);
    }

    const sql = 'INSERT INTO community_posts (caption, community, image) VALUES (?, ?, ?)';
    db.query(sql, [caption, community, imagePath], (err, result) => {

      if (err){console.error('❌ DB Error:', err);
         return res.status(500).json({ message: 'Failed to save post' });}
     return res.status(200).json({
        message: 'Post created successfully',
        postId: result.insertId, // Optional for frontend use
        image: imagePath,
        caption,
        community
     });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Image processing failed' });
  }
});


router.get('/community-posts/:communityId', (req, res) => {
  const communityId = req.params.communityId;
  const sql = 'SELECT * FROM community_posts WHERE community = ? ORDER BY id DESC';

  db.query(sql, [communityId], (err, results) => {
    if (err){
      console.error('❌ Fetch Error:', err);
      return res.status(500).json({ message: 'Fetch failed' }); // ✅ error response with message
    }
    res.status(200).json(results); //
  });
});

module.exports = router;
