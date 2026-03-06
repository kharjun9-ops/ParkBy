const API = "https://parkby-production-4e9c.up.railway.app";

// Toast notification system
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
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Set loading state
function setLoading(isLoading) {
  const btn = document.getElementById('loginBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  
  if (isLoading) {
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btnText.textContent = 'Signing in...';
    btnSpinner.classList.remove('hidden');
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btnText.textContent = 'Sign In';
    btnSpinner.classList.add('hidden');
  }
}

// Login function
async function login(event) {
  if (event) event.preventDefault();
  
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  // Validate inputs
  if (!email || !password) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'warning');
    return;
  }

  setLoading(true);
  msg.innerHTML = '';

  try {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.token) {
      setLoading(false);
      showToast(data.message || 'Login failed. Please check your credentials.', 'error');
      
      // Shake animation on error
      const card = document.querySelector('.login-card');
      card.style.animation = 'shake 0.5s ease';
      setTimeout(() => card.style.animation = '', 500);
      return;
    }

    // Success!
    showToast('Login successful! Redirecting...', 'success');

    // Save credentials
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userEmail", email);

    // Redirect with delay for UX
    setTimeout(() => {
      if (data.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "user.html";
      }
    }, 1000);

  } catch (err) {
    setLoading(false);
    showToast('Cannot connect to server. Please try again later.', 'error');
    console.error('Login error:', err);
  }
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (token) {
    if (role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'user.html';
    }
  }
  
  // Focus on email input
  document.getElementById('email').focus();
});

// Enter key support
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    login(e);
  }
});
