function goBack() {
    window.location.href = "./dashboard.html";
}

async function loadEarnings() {
    const employee_id = localStorage.getItem("employee_id");

    const res = await fetch(CONFIG.BACKEND + "/api/job/earnings", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ employee_id })
    });

    const data = await res.json();

    if (!data.ok) return;

    // XP + LEVEL
    document.getElementById("empLevel").innerText = data.level;
    document.getElementById("empXP").innerText = data.xp;
    document.getElementById("xpTarget").innerText = data.xp_target;
    document.getElementById("xpFill").style.width = `${data.xp_percent}%`;

    // BHIX WALLET
    document.getElementById("bhixAmount").innerText = data.bhix;

    // MONEY
    document.getElementById("todayEarn").innerText = "₹" + data.today;
    document.getElementById("monthEarn").innerText = "₹" + data.month;
    document.getElementById("totalEarn").innerText = "₹" + data.total;

    // PERFORMANCE METRICS
    document.getElementById("qualifiedCount").innerText = data.qualified;
    document.getElementById("disqualifiedCount").innerText = data.disqualified;
    document.getElementById("followCount").innerText = data.followups_completed;
    document.getElementById("streakCount").innerText = data.streak;
}

function openClaim() {
    alert("Claim system coming soon!");
}

function openHistory() {
    alert("BHIX transaction history coming soon!");
}

loadEarnings();
