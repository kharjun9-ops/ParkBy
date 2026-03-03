const API = "http://localhost:5000";

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.innerText = "Logging in...";

  try {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.token) {
      msg.innerText = data.message || "Login failed";
      return;
    }

    // SAVE TOKEN + ROLE
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    // REDIRECT BASED ON ROLE
    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }

  } catch (err) {
    msg.innerText = "Server error";
  }
}