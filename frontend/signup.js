const API = "http://localhost:5000";

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
  
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Set loading state
function setLoading(isLoading) {
  const btn = document.getElementById('signupBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  
  if (isLoading) {
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btnText.textContent = 'Creating account...';
    btnSpinner.classList.remove('hidden');
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btnText.textContent = 'Create Account';
    btnSpinner.classList.add('hidden');
  }
}

// Signup function
async function signup(event) {
  if (event) event.preventDefault();
  
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const msg = document.getElementById("msg");

  // Validate inputs
  if (!name || !email || !password || !confirmPassword) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  // Name validation
  if (name.length < 2) {
    showToast('Name must be at least 2 characters', 'warning');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'warning');
    return;
  }

  // Password validation
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'warning');
    return;
  }

  // Confirm password
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'warning');
    document.getElementById("confirmPassword").focus();
    return;
  }

  setLoading(true);
  msg.innerHTML = '';

  try {
    const res = await fetch(`${API}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      showToast(data.message || 'Registration failed', 'error');
      
      // Shake animation on error
      const card = document.querySelector('.login-card');
      card.style.animation = 'shake 0.5s ease';
      setTimeout(() => card.style.animation = '', 500);
      return;
    }

    // Success!
    showToast('Account created successfully! Redirecting to login...', 'success');
    
    msg.innerHTML = `
      <div class="message success" style="margin-top: 16px;">
        ✅ Account created! Redirecting...
      </div>
    `;

    // Redirect to login after delay
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);

  } catch (err) {
    setLoading(false);
    showToast('Cannot connect to server. Please try again later.', 'error');
    console.error('Signup error:', err);
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
  
  // Focus on name input
  document.getElementById('name').focus();
});
