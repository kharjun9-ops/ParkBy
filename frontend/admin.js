const API = "http://localhost:5000";
const token = localStorage.getItem("token");

// Protect page
if (!token) {
  window.location.href = "login.html";
}

// Store all slots for filtering
let allSlotsData = [];
let currentFilter = 'all';

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
// ADD NEW SLOT
// ============================
async function addSlot(event) {
  if (event) event.preventDefault();
  
  const slotNumber = document.getElementById("slotNumber").value.trim().toUpperCase();
  const vehicleType = document.getElementById("vehicleType").value;
  const msg = document.getElementById("adminMsg");

  if (!slotNumber || !vehicleType) {
    showToast('Please fill all fields', 'warning');
    return;
  }

  // Validate slot number format
  const slotRegex = /^[A-Z]{1,2}[0-9]{1,3}$/;
  if (!slotRegex.test(slotNumber)) {
    showToast('Invalid slot format. Use letters + numbers (e.g., C10, B05)', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API}/api/admin/add-slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        slot_number: slotNumber, 
        vehicle_type: vehicleType 
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      showToast(`Slot ${slotNumber} added successfully!`, 'success');
      msg.innerHTML = `<div class="message success">✅ Slot ${slotNumber} created!</div>`;
      
      // Clear form
      document.getElementById("slotNumber").value = '';
      document.getElementById("vehicleType").value = '';
      
      // Refresh slots
      loadAllSlots();
    } else {
      showToast(data.message || 'Failed to add slot', 'error');
      msg.innerHTML = `<div class="message error">❌ ${data.message || 'Failed to add slot'}</div>`;
    }
    
  } catch (err) {
    showToast('Server error. Please try again.', 'error');
    msg.innerHTML = `<div class="message error">❌ Server error</div>`;
  }

  // Clear message after 5 seconds
  setTimeout(() => {
    msg.innerHTML = '';
  }, 5000);
}

// ============================
// RESET SLOT BY ID
// ============================
async function resetSlot(event) {
  if (event) event.preventDefault();
  
  const slotId = document.getElementById("resetSlotId").value;

  if (!slotId) {
    showToast('Please enter a slot ID', 'warning');
    return;
  }

  if (!confirm(`Are you sure you want to reset Slot ID ${slotId}?`)) {
    return;
  }

  try {
    const res = await fetch(`${API}/api/admin/reset-slot/${slotId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();
    
    if (res.ok) {
      showToast(`Slot ID ${slotId} has been reset`, 'success');
      document.getElementById("resetSlotId").value = '';
      loadAllSlots();
    } else {
      showToast(data.message || 'Failed to reset slot', 'error');
    }
    
  } catch (err) {
    showToast('Server error. Please try again.', 'error');
  }
}

// ============================
// RESET SLOT BY BUTTON CLICK
// ============================
async function resetSlotById(id, slotNumber) {
  if (!confirm(`Reset Slot ${slotNumber}? This will make it available again.`)) {
    return;
  }

  try {
    const res = await fetch(`${API}/api/admin/reset-slot/${id}`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });

    const data = await res.json();
    
    if (res.ok) {
      showToast(`Slot ${slotNumber} reset successfully`, 'success');
      loadAllSlots();
    } else {
      showToast(data.message || 'Failed to reset', 'error');
    }
    
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// ============================
// LOAD ALL SLOTS
// ============================
async function loadAllSlots() {
  const container = document.getElementById("allSlots");
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await fetch(`${API}/api/slots`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    const slots = await res.json();
    allSlotsData = slots;
    
    // Update stats
    updateStats(slots);
    
    // Render slots
    renderSlots(slots);
    
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3>Connection Error</h3>
        <p>Could not load slots. Please try again.</p>
        <button class="btn btn-primary mt-2" onclick="loadAllSlots()">Retry</button>
      </div>
    `;
    showToast('Failed to load slots', 'error');
  }
}

// ============================
// RENDER SLOTS LIST
// ============================
function renderSlots(slots) {
  const container = document.getElementById("allSlots");
  const searchTerm = document.getElementById("searchSlot")?.value.toLowerCase() || '';
  
  // Apply filters
  let filteredSlots = slots;
  
  if (currentFilter === 'available') {
    filteredSlots = slots.filter(s => s.status !== 'booked');
  } else if (currentFilter === 'booked') {
    filteredSlots = slots.filter(s => s.status === 'booked');
  }
  
  // Apply search
  if (searchTerm) {
    filteredSlots = filteredSlots.filter(s => 
      s.slot_number.toLowerCase().includes(searchTerm)
    );
  }
  
  if (filteredSlots.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🅿️</div>
        <h3>No Slots Found</h3>
        <p>${searchTerm ? 'No slots match your search.' : 'No parking slots in this category.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  filteredSlots.forEach((slot, index) => {
    const div = document.createElement("div");
    div.className = "admin-slot-item";
    div.style.animation = `fadeInUp 0.3s ease forwards`;
    div.style.animationDelay = `${index * 0.03}s`;
    div.style.opacity = '0';

    const icon = slot.vehicle_type === 'car' ? '🚗' : '🏍️';
    const statusClass = slot.status === 'booked' ? 'booked' : 'available';
    const statusText = slot.status === 'booked' ? 'Booked' : 'Available';

    div.innerHTML = `
      <div class="admin-slot-info">
        <div class="admin-slot-icon ${slot.vehicle_type}">${icon}</div>
        <div class="admin-slot-details">
          <h4>${slot.slot_number}</h4>
          <p>${slot.vehicle_type.charAt(0).toUpperCase() + slot.vehicle_type.slice(1)} • ID: ${slot.id}</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="status-badge ${statusClass}">${statusText}</span>
        ${slot.status === 'booked' 
          ? `<button class="btn btn-sm btn-danger" onclick="resetSlotById(${slot.id}, '${slot.slot_number}')">Reset</button>`
          : ''
        }
      </div>
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
  const booked = slots.filter(s => s.status === 'booked').length;
  const occupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
  
  animateCounter('totalSlots', total);
  animateCounter('availableSlots', available);
  animateCounter('bookedSlots', booked);
  document.getElementById('occupancyRate').textContent = `${occupancy}%`;
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  const duration = 1000;
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
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
// FILTER SLOTS
// ============================
function filterSlots(filter, btn) {
  currentFilter = filter;
  
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  btn.classList.add('active');
  
  // Re-render
  renderSlots(allSlotsData);
}

// ============================
// SEARCH SLOTS
// ============================
function searchSlots() {
  renderSlots(allSlotsData);
}

// ============================
// INITIALIZATION
// ============================
document.addEventListener('DOMContentLoaded', () => {
  // Load theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeBtn").innerHTML = "☀️";
  }
  
  // Load initial data
  loadAllSlots();
  
  // Auto refresh every 30 seconds
  setInterval(loadAllSlots, 30000);
});
