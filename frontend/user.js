const API = "http://localhost:5000";
const token = localStorage.getItem("token");

// Protect page
if (!token) {
  window.location.href = "login.html";
}

// Current filter state
let currentFilter = 'all';
let allSlots = [];

// ============================
// TOAST NOTIFICATIONS
// ============================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span style="font-size: 20px;">${icons[type]}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================
// LOGOUT
// ============================
function logout() {
  showToast('Logging out...', 'info');
  setTimeout(() => {
    localStorage.clear();
    window.location.href = "login.html";
  }, 1000);
}

// ============================
// THEME TOGGLE
// ============================
function toggleTheme() {
  document.body.classList.toggle("dark");

  const btn = document.getElementById("themeBtn");
  if (document.body.classList.contains("dark")) {
    btn.innerHTML = "☀️";
    localStorage.setItem("theme", "dark");
    showToast('Dark mode enabled', 'info');
  } else {
    btn.innerHTML = "🌙";
    localStorage.setItem("theme", "light");
    showToast('Light mode enabled', 'info');
  }
}

// ============================
// FILTER TABS
// ============================
function setFilter(type, btn) {
  currentFilter = type;
  
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  btn.classList.add('active');
  
  // Re-render slots
  renderSlots(allSlots);
}

// ============================
// LOAD AVAILABLE SLOTS
// ============================
async function loadSlots(type = "") {
  const container = document.getElementById("slots");
  container.innerHTML = '<div class="spinner"></div>';

  try {
    let url = `${API}/api/slots`;
    if (type) url += `?type=${type}`;

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const slots = await res.json();
    allSlots = slots.filter(s => s.status !== 'booked');
    
    // Update stats
    updateStats(slots);
    
    // Render slots
    renderSlots(allSlots);
    
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3>Connection Error</h3>
        <p>Could not load parking slots. Please try again.</p>
        <button class="btn btn-primary mt-2" onclick="loadSlots()">Retry</button>
      </div>
    `;
    showToast('Failed to load slots', 'error');
  }
}

// ============================
// RENDER SLOTS GRID
// ============================
function renderSlots(slots) {
  const container = document.getElementById("slots");
  
  // Filter slots based on current filter
  let filteredSlots = slots;
  if (currentFilter !== 'all') {
    filteredSlots = slots.filter(s => s.vehicle_type === currentFilter);
  }
  
  if (!filteredSlots || filteredSlots.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🅿️</div>
        <h3>No Slots Available</h3>
        <p>All parking spots are currently booked. Check back later!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  
  filteredSlots.forEach((slot, index) => {
    const div = document.createElement("div");
    div.className = `slot-card ${slot.vehicle_type}`;
    div.style.animationDelay = `${index * 0.05}s`;

    const icon = slot.vehicle_type === 'car' ? '🚗' : '🏍️';

    div.innerHTML = `
      <div class="slot-icon">${icon}</div>
      <div class="slot-number">${slot.slot_number}</div>
      <div class="slot-type">${slot.vehicle_type}</div>
      <button class="btn btn-primary btn-sm" onclick="bookSlot(${slot.id}, '${slot.slot_number}')">
        Book Now
      </button>
    `;

    container.appendChild(div);
  });
}

// ============================
// UPDATE STATS
// ============================
function updateStats(slots) {
  const total = slots.length;
  const available = slots.filter(s => s.status !== 'booked').length;
  const cars = slots.filter(s => s.vehicle_type === 'car' && s.status !== 'booked').length;
  const bikes = slots.filter(s => s.vehicle_type === 'bike' && s.status !== 'booked').length;
  
  animateCounter('totalSlots', total);
  animateCounter('availableSlots', available);
  animateCounter('carSlots', cars);
  animateCounter('bikeSlots', bikes);
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  const duration = 1000;
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * easeOut);
    
    el.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// ============================
// BOOK SLOT
// ============================
async function bookSlot(slotId, slotNumber) {
  const vehicleInput = document.getElementById("vehicleNumber");
  const vehicleNumber = vehicleInput.value.trim().toUpperCase();

  if (!vehicleNumber) {
    showToast('Please enter your vehicle number first', 'warning');
    vehicleInput.focus();
    vehicleInput.style.animation = 'shake 0.5s ease';
    setTimeout(() => vehicleInput.style.animation = '', 500);
    return;
  }

  // Vehicle number validation
  const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/;
  if (!vehicleRegex.test(vehicleNumber)) {
    showToast('Please enter a valid vehicle number (e.g., KA01AB1234)', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API}/api/book-slot/${slotId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ vehicleNumber })
    });

    const data = await res.json();
    
    if (res.ok) {
      showToast(`Slot ${slotNumber} booked successfully!`, 'success');
      vehicleInput.value = "";
      
      // Refresh data
      loadSlots();
      loadMyBookings();
    } else {
      showToast(data.message || 'Booking failed', 'error');
    }
    
  } catch (err) {
    showToast('Failed to book slot. Please try again.', 'error');
  }
}

// ============================
// LOAD MY BOOKINGS
// ============================
async function loadMyBookings() {
  const container = document.getElementById("myBookings");
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch(`${API}/api/my-bookings`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const bookings = await res.json();

    if (!bookings || bookings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No Active Bookings</h3>
          <p>Book a parking spot to see it here!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    
    bookings.forEach((booking, index) => {
      const div = document.createElement("div");
      div.className = `booking-card ${booking.vehicle_type}`;
      div.style.animationDelay = `${index * 0.1}s`;
      div.style.animation = 'fadeInUp 0.5s ease forwards';
      div.style.opacity = '0';

      const icon = booking.vehicle_type === 'car' ? '🚗' : '🏍️';

      div.innerHTML = `
        <div class="booking-icon">${icon}</div>
        <div class="booking-info">
          <h4>Slot ${booking.slot_number}</h4>
          <p>${booking.vehicle_type.charAt(0).toUpperCase() + booking.vehicle_type.slice(1)} Parking</p>
        </div>
        <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id}, '${booking.slot_number}')">
          Cancel
        </button>
      `;

      container.appendChild(div);
    });
    
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3>Error Loading Bookings</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

// ============================
// CANCEL BOOKING
// ============================
async function cancelBooking(bookingId, slotNumber) {
  if (!confirm(`Are you sure you want to cancel your booking for Slot ${slotNumber}?`)) {
    return;
  }

  try {
    const res = await fetch(`${API}/api/cancel-booking/${bookingId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();
    
    if (res.ok) {
      showToast(`Booking for Slot ${slotNumber} cancelled`, 'success');
      loadSlots();
      loadMyBookings();
    } else {
      showToast(data.message || 'Failed to cancel booking', 'error');
    }
    
  } catch (err) {
    showToast('Failed to cancel booking. Please try again.', 'error');
  }
}

// ============================
// INITIALIZATION
// ============================
document.addEventListener('DOMContentLoaded', () => {
  // Set user email in navbar
  const userEmail = localStorage.getItem('userEmail') || 'User';
  document.getElementById('userEmail').textContent = userEmail.split('@')[0];
  
  // Load theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeBtn").innerHTML = "☀️";
  }
  
  // Load initial data
  loadSlots();
  loadMyBookings();
  
  // Auto refresh every 30 seconds
  setInterval(() => {
    loadSlots();
    loadMyBookings();
  }, 30000);
});

// Add shake animation for input validation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);
