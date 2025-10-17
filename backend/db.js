// db.js
console.log('[db.js] LOADED with eco_user settings');

const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dee_chethu', 
  database: 'ecopick'     
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL Connection Error:', err);
    
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

module.exports = db;