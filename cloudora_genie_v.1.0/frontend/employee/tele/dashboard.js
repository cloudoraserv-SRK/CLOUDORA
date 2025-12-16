/* =====================================================
   CLOUDORA GAMIFIED DASHBOARD JS
   Work Mode Toggle + XP Engine + UI Controller
   ===================================================== */
window.addEventListener("DOMContentLoaded", () => {
  const employeeId = localStorage.getItem("employee_id");
  const department = localStorage.getItem("employee_department"); // ✅ FIX

  if (!employeeId || !department) {
    alert("Session expired. Please login again.");
    window.location.href = "../login.html";
    return;
  }

  const role = getRoleFromDepartment(department);
  console.log("DEPT:", department, "ROLE:", role);

  if (role !== "tele") {
    alert("Unauthorized: Tele dashboard access only");
    window.location.href = "../login.html";
  }
});



// --------------- HELPER FUNCTION --------------------
function openPage(url) {
    window.location.href = url;
}


// --------------- LOAD EMPLOYEE SESSION --------------
const empID = localStorage.getItem("employee_id");
const empName = localStorage.getItem("employee_name");
const empDept = localStorage.getItem("employee_department");
const empShift = localStorage.getItem("employee_shift");

if (!empID) window.location.href = "./login.html";

// Display employee info
document.getElementById("empID").innerText = empID;
document.getElementById("empName").innerText = empName || "Employee";
document.getElementById("empDept").innerText = empDept || "-";
document.getElementById("empShift").innerText = empShift || "-";


// ------------------ LOGOUT -------------------------
document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "../login.html";
};


// =====================================================
// WORK MODE TOGGLE SYSTEM
// =====================================================

const workToggle = document.getElementById("workToggle");
const workModePanel = document.getElementById("workModePanel");
const freeModePanel = document.getElementById("freeModePanel");
const modeLabel = document.getElementById("modeLabel");

// Default mode display
let savedMode = localStorage.getItem("work_mode") || "free";
applyMode(savedMode);
workToggle.checked = savedMode === "work";

// Toggle Listener
workToggle.addEventListener("change", function() {
    const mode = this.checked ? "work" : "free";
    localStorage.setItem("work_mode", mode);
    applyMode(mode);
});

// APPLY MODE TO UI
function applyMode(mode) {
    if (mode === "work") {
        modeLabel.innerText = "WORK MODE";
        workModePanel.classList.remove("hidden");
        freeModePanel.classList.add("hidden");
        modeLabel.style.color = "#00d4ff";
    } else {
        modeLabel.innerText = "FREE MODE";
        workModePanel.classList.add("hidden");
        freeModePanel.classList.remove("hidden");
        modeLabel.style.color = "#7b2ff7";
    }
}
// Toggle Listener
workToggle.addEventListener("change", function () {
    if (this.checked) {
        activateWorkMode();
    } else {
        activateFreeMode();
    }
});


// -------------------- WORK MODE ----------------------
function activateWorkMode() {
    workModePanel.classList.remove("hidden");
    freeModePanel.classList.add("hidden");
    modeLabel.innerText = "WORK MODE";

    // Add glow effect
    modeLabel.style.color = "#00d4ff";

    // Start Work Timer (future integration)
    console.log("Work Mode Activated");
}


// -------------------- FREE MODE ----------------------
function activateFreeMode() {
    workModePanel.classList.add("hidden");
    freeModePanel.classList.remove("hidden");
    modeLabel.innerText = "FREE MODE";

    modeLabel.style.color = "#7b2ff7";

    console.log("Free Mode Activated");
}



// =====================================================
// XP BAR ANIMATION (BHIX ENGINE)
// =====================================================

let xp = 30;        // starting xp %
let maxXP = 100;

function updateXPBar() {
    const xpFill = document.getElementById("xpFill");

    let percent = (xp / maxXP) * 100;

    xpFill.style.width = percent + "%";

    // Glow effect when high XP
    if (percent > 75) {
        xpFill.style.boxShadow = "0 0 12px rgba(0,212,255,0.8)";
    }
}

updateXPBar();



// =====================================================
// BHIX COIN COUNTER (future backend integration)
// =====================================================

let coinCount = localStorage.getItem("bhix_coins") || 0;
document.getElementById("coinCount").innerText = coinCount;


// =====================================================
// FUTURE HOOKS FOR BACKEND INTEGRATION
// =====================================================

// When employee extracts new leads
function addBHIXReward(amount) {
    let coins = parseInt(localStorage.getItem("bhix_coins") || "0");
    coins += amount;
    localStorage.setItem("bhix_coins", coins);
    document.getElementById("coinCount").innerText = coins;
}

// When employee completes a call update
function addXP(amount) {
    xp += amount;
    if (xp > maxXP) xp = maxXP;
    updateXPBar();
}

function getRoleFromDepartment(dept) {
  if (!dept) return null;

  if (
    dept === "tele_lead_domestic" ||
    dept === "telecaller_domestic" ||
    dept.startsWith("tele")
  ) {
    return "tele";
  }

  if (dept === "sales" || dept.startsWith("sales")) {
    return "sales";
  }

  return null;
}


// =====================================================
// LANGUAGE SELECTOR INIT (From global.js)
// =====================================================
if (typeof initializeLanguageSelector === "function") {
    initializeLanguageSelector();
    applyTranslations();
}
