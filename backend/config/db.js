
const mysql = require("mysql2");

// Use environment variables for database connection
// This allows the same code to work locally AND on Railway
const db = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "AniArjun2803",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "parkby",
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// force-test DB connection
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ MySQL connected to parkby database");
  }
});

module.exports = db;