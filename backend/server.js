require("dotenv").config();
const adminMiddleware = require("./middleware/admin");
const authMiddleware = require("./middleware/auth");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./config/db");
console.log("db.js file loaded");

const app = express();

// CORS - Allow requests from anywhere (for GitHub Pages, etc.)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend + MySQL is working 🚀");
});

// SIGNUP ROUTE
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // check if user already exists
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [email], async (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // insert user
      const insertQuery =
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

      db.query(
        insertQuery,
        [name, email, hashedPassword],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: "Error creating user" });
          }

          res.status(201).json({ message: "User registered successfully ✅" });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// LOGIN ROUTE
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      role: user.role
    });
  });
});

// PROTECTED ROUTE
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Access granted ✅",
    user: req.user,
  });
});

// GET AVAILABLE PARKING SLOTS (OPTIONAL FILTER BY VEHICLE TYPE)
app.get("/api/slots", authMiddleware, (req, res) => {
  const type = req.query.type;

  let query = "SELECT * FROM parking_slots WHERE status = 'free'";
  let params = [];

  if (type) {
    query += " AND vehicle_type = ?";
    params.push(type);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// BOOK A PARKING SLOT + SAVE BOOKING (PROTECTED)
app.post("/api/book-slot/:id", authMiddleware, (req, res) => {
  const slotId = req.params.id;
  const userId = req.user.id;
  const { vehicleNumber } = req.body; // 🔥 FIX

  if (!vehicleNumber) {
    return res.status(400).json({ message: "Vehicle number required" });
  }

  const checkQuery = "SELECT * FROM parking_slots WHERE id = ?";

  db.query(checkQuery, [slotId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.length === 0) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (result[0].status === "booked") {
      return res.status(400).json({ message: "Slot already booked" });
    }

    const updateSlot =
      "UPDATE parking_slots SET status = 'booked' WHERE id = ?";
    const insertBooking =
      "INSERT INTO bookings (user_id, slot_id, vehicle_number) VALUES (?, ?, ?)";

    db.query(updateSlot, [slotId], (err) => {
      if (err) return res.status(500).json({ message: "Booking failed" });

      db.query(insertBooking, [userId, slotId, vehicleNumber], (err) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Booking history save failed" });

        res.json({ message: "Slot booked successfully 🅿️" });
      });
    });
  });
});

// GET MY BOOKINGS (USER)
app.get("/api/my-bookings", authMiddleware, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      b.id,
      p.slot_number,
      p.vehicle_type,
      b.booked_at
    FROM bookings b
    JOIN parking_slots p ON b.slot_id = p.id
    WHERE b.user_id = ?
    ORDER BY b.booked_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// ADD NEW PARKING SLOT (ADMIN)
app.post(
  "/api/admin/add-slot",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const { slot_number, vehicle_type } = req.body;

    if (!slot_number || !vehicle_type) {
      return res.status(400).json({ message: "All fields required" });
    }

    const query =
      "INSERT INTO parking_slots (slot_number, vehicle_type) VALUES (?, ?)";

    db.query(query, [slot_number, vehicle_type], (err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to add slot" });
      }
      res.json({ message: "Slot added successfully ✅" });
    });
  }
);

// ADMIN: RESET SLOT TO FREE
app.post(
  "/api/admin/reset-slot/:id",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const slotId = req.params.id;

    const resetSlot =
      "UPDATE parking_slots SET status = 'free' WHERE id = ?";
    const deleteBooking =
      "DELETE FROM bookings WHERE slot_id = ?";

    db.query(resetSlot, [slotId], (err) => {
      if (err) {
        return res.status(500).json({ message: "Reset failed" });
      }

      db.query(deleteBooking, [slotId], (err) => {
        if (err) {
          return res.status(500).json({ message: "Booking cleanup failed" });
        }

        res.json({ message: "Slot reset to free 🔄" });
      });
    });
  }
);

// CANCEL MY BOOKING (USER)
app.delete("/api/cancel-booking/:id", authMiddleware, (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  const findBooking =
    "SELECT * FROM bookings WHERE id = ? AND user_id = ?";

  db.query(findBooking, [bookingId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const slotId = result[0].slot_id;

    const deleteBooking =
      "DELETE FROM bookings WHERE id = ?";
    const freeSlot =
      "UPDATE parking_slots SET status = 'free' WHERE id = ?";

    db.query(deleteBooking, [bookingId], (err) => {
      if (err)
        return res.status(500).json({ message: "Cancel failed" });

      db.query(freeSlot, [slotId], (err) => {
        if (err)
          return res.status(500).json({ message: "Slot update failed" });

        res.json({ message: "Booking cancelled, slot freed ✅" });
      });
    });
  });
});

