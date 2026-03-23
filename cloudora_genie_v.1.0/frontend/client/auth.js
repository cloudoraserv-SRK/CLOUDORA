(function () {
  const API_BASE = window.CONFIG?.BACKEND || "";
  const SESSION_KEY = "cloudora_client_session";
  const statusNode = document.getElementById("clientAuthStatus");
  const loginForm = document.getElementById("clientLoginForm");
  const signupForm = document.getElementById("clientSignupForm");

  function setStatus(text) {
    statusNode.textContent = text;
  }

  function saveSession(client) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(client));
  }

  function goToDashboard() {
    window.location.href = "./dashboard.html";
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Logging in...");

    const response = await fetch(`${API_BASE}/api/client/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value.trim()
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setStatus(payload.error || "Client login failed");
      return;
    }

    saveSession(payload.client);
    setStatus("Login successful. Opening workspace...");
    goToDashboard();
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Creating client account...");

    const response = await fetch(`${API_BASE}/api/client/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById("signupName").value.trim(),
        business_name: document.getElementById("signupBusiness").value.trim(),
        email: document.getElementById("signupEmail").value.trim(),
        phone: document.getElementById("signupPhone").value.trim(),
        password: document.getElementById("signupPassword").value.trim()
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setStatus(payload.error || "Client signup failed");
      return;
    }

    saveSession(payload.client);
    setStatus("Client account created. Opening workspace...");
    goToDashboard();
  });

  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (session?.id) goToDashboard();
  } catch {}
})();
