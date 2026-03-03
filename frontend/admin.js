const API = "http://localhost:5000";
const token = localStorage.getItem("token");

// Safety check
if (!token) {
  window.location.href = "login.html";
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Add slot
async function addSlot() {
  const slot_number = document.getElementById("slotNumber").value;
  const vehicle_type = document.getElementById("vehicleType").value;
  const msg = document.getElementById("adminMsg");

  if (!slot_number || !vehicle_type) {
    msg.innerText = "Please fill all fields";
    return;
  }

  const res = await fetch(`${API}/api/admin/add-slot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ slot_number, vehicle_type })
  });

  const data = await res.json();
  msg.innerText = data.message;
}

// Reset slot
async function resetSlot() {
  const slotId = document.getElementById("resetSlotId").value;

  if (!slotId) {
    alert("Enter slot ID");
    return;
  }

  const res = await fetch(`${API}/api/admin/reset-slot/${slotId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();
  alert(data.message);
}

// Load all slots
async function loadAllSlots() {
  const res = await fetch(`${API}/api/slots`);
  const slots = await res.json();

  const list = document.getElementById("allSlots");
  list.innerHTML = "";

  slots.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${s.slot_number}</strong> (${s.vehicle_type}) — 
      <span>${s.status}</span>
      ${s.status === "booked"
        ? `<button onclick="resetSlotById(${s.id})">Reset</button>`
        : ""
      }
    `;
    list.appendChild(li);
  });
}

// Reset by clicking button
async function resetSlotById(id) {
  if (!confirm("Reset this slot?")) return;

  const res = await fetch(`${API}/api/admin/reset-slot/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  alert(data.message);
  loadAllSlots();
}