(function () {
  const ACCOUNTS_KEY = "cloudora_admin_accounts";
  const SESSION_KEY = "cloudora_admin_session";
  const statusNode = document.getElementById("adminAuthStatus");
  const bootstrapForm = document.getElementById("bootstrapAdminForm");
  const loginForm = document.getElementById("adminLoginForm");

  function getAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function setStatus(text) {
    statusNode.textContent = text;
  }

  function openAdmin() {
    window.location.href = "./admin.html";
  }

  bootstrapForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const accounts = getAccounts();
    const email = document.getElementById("adminCreateEmail").value.trim().toLowerCase();
    if (accounts.some((item) => item.email === email)) {
      setStatus("Admin already exists for this email");
      return;
    }

    const account = {
      id: `admin_${Date.now()}`,
      name: document.getElementById("adminCreateName").value.trim(),
      email,
      password: document.getElementById("adminCreatePassword").value.trim()
    };
    accounts.push(account);
    saveAccounts(accounts);
    localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    setStatus("Admin created. Opening admin panel...");
    openAdmin();
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("adminLoginEmail").value.trim().toLowerCase();
    const password = document.getElementById("adminLoginPassword").value.trim();
    const account = getAccounts().find((item) => item.email === email && item.password === password);
    if (!account) {
      setStatus("Invalid admin credentials");
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    setStatus("Admin login successful. Opening panel...");
    openAdmin();
  });

  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (session?.id) openAdmin();
  } catch {}
})();
