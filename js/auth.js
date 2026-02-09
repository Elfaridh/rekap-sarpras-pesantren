function setCurrentUser(user) {
  localStorage.setItem("sarprasUser", JSON.stringify(user));
}

function getCurrentUser() {
  const raw = localStorage.getItem("sarprasUser");
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem("sarprasUser");
  window.location.href = "login.html";
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("loginMessage");

  const user = await getByKey("users", username);
  if (!user || user.password !== password) {
    message.textContent = "Username atau password salah.";
    message.style.color = "#dc2626";
    return;
  }

  setCurrentUser({ username: user.username, role: user.role });
  window.location.href = "index.html";
}

function guardAuth() {
  const user = getCurrentUser();
  const isLoginPage = window.location.pathname.endsWith("login.html");
  if (user && isLoginPage) {
    window.location.href = "index.html";
    return;
  }
  if (!user && !isLoginPage) {
    window.location.href = "login.html";
  }
}

function renderUserInfo() {
  const user = getCurrentUser();
  const userInfo = document.getElementById("userInfo");
  if (userInfo && user) {
    userInfo.textContent = `${user.username} • ${user.role}`;
  }
}

function setupLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}

function isAdmin() {
  const user = getCurrentUser();
  return user?.role === "Admin";
}
