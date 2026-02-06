function login(username, role) {
  localStorage.setItem("user", JSON.stringify({ username, role }));
  window.location.href = "index.html";
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function guard(role) {
  const user = getUser();
  if (!user || (role && user.role !== role)) {
    window.location.href = "login.html";
  }
}
