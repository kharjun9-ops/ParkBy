const API = "http://localhost:5000";
const token = localStorage.getItem("token");

// Protect page
if (!token) {
  window.location.href = "login.html";
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Load available slots
async function loadSlots(type = "") {
  let url = `${API}/api/slots`;
  if (type) url += `?type=${type}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const slots = await res.json();

  const container = document.getElementById("slots");
  container.innerHTML = "";

  if (!slots || slots.length === 0) {
    container.innerHTML = "<p>No slots available</p>";
    return;
  }

  slots.forEach(slot => {
    // 🔒 extra safety: do not show booked slots
    if (slot.status === "booked") return;

    const div = document.createElement("div");
    div.className = `slot ${slot.vehicle_type}`;

    div.setAttribute("data-type", slot.vehicle_type);

    div.innerHTML = `
    
    <strong>${slot.slot_number}</strong>
    <button onclick="bookSlot(${slot.id})">Book</button>
    <span class="badge">${slot.vehicle_type.toUpperCase()}</span>
    `;

    container.appendChild(div);
  });
}

// Book slot (with vehicle number)
async function bookSlot(slotId) {
  const vehicleInput = document.getElementById("vehicleNumber");
  const vehicleNumber = vehicleInput.value.trim();

  if (!vehicleNumber) {
    alert("Please enter vehicle number");
    return;
  }

  const res = await fetch(`${API}/api/book-slot/${slotId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ vehicleNumber })
  });

  const data = await res.json();
  alert(data.message);

  vehicleInput.value = "";

  loadSlots();
  loadMyBookings();
}

// Load my bookings
async function loadMyBookings() {
  const res = await fetch(`${API}/api/my-bookings`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const bookings = await res.json();
  const list = document.getElementById("myBookings");
  list.innerHTML = "";

  if (bookings.length === 0) {
    list.innerHTML = "<li>No bookings yet</li>";
    return;
  }

  bookings.forEach(b => {
    const div = document.createElement("div");
    div.className = `slot ${b.vehicle_type}`;
    div.setAttribute("data-type", b.vehicle_type);

    div.innerHTML = `
      <strong>${b.slot_number}</strong>
      <button onclick="cancelBooking(${b.id})">Cancel</button>
    `;

    list.appendChild(div);
  });
}
// Cancel booking
async function cancelBooking(bookingId) {
  const res = await fetch(`${API}/api/cancel-booking/${bookingId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();
  alert(data.message);
  loadSlots();
  loadMyBookings();
}

// Auto load slots on page open
loadSlots();

function toggleTheme() {
  document.body.classList.toggle("dark");

  const btn = document.getElementById("themeBtn");
  if (document.body.classList.contains("dark")) {
    btn.innerText = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    btn.innerText = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
}

// Auto load theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  document.getElementById("themeBtn").innerText = "☀️ Light Mode";
}