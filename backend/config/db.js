
const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "AniArjun2803", // your root password
  database: "parkby",
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