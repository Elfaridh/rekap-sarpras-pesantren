function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

function initAuthPage() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
}

function initPage() {
  guardAuth();
  renderUserInfo();
  setupLogoutButton();
  registerServiceWorker();
  initAuthPage();
}

document.addEventListener("DOMContentLoaded", () => {
  openDB().then(() => {
    initPage();
    if (window.pageInit) window.pageInit();
  });
});
