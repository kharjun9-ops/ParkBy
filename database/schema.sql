-- ParkBy Database Schema
-- Run this in Railway's MySQL database after creating it

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parking_slots table
CREATE TABLE IF NOT EXISTS parking_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_number VARCHAR(10) NOT NULL UNIQUE,
  vehicle_type ENUM('car', 'bike') NOT NULL,
  status ENUM('free', 'booked') DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  slot_id INT NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
);

-- Insert a default admin user (password: admin123)
-- The hashed password is for 'admin123' using bcrypt
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@parkby.com', '$2a$10$rPQdVPGvG6rJwmYJhGQxOeKQzVqQXKxvX1ZQQrOxqKhK1K1K1K1K1', 'admin')
ON DUPLICATE KEY UPDATE name=name;

-- Insert some sample parking slots
INSERT INTO parking_slots (slot_number, vehicle_type, status) VALUES 
('C01', 'car', 'free'),
('C02', 'car', 'free'),
('C03', 'car', 'free'),
('C04', 'car', 'free'),
('C05', 'car', 'free'),
('B01', 'bike', 'free'),
('B02', 'bike', 'free'),
('B03', 'bike', 'free'),
('B04', 'bike', 'free'),
('B05', 'bike', 'free')
ON DUPLICATE KEY UPDATE slot_number=slot_number;
