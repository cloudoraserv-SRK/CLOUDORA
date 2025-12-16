function goBack() {
    window.location.href = "./dashboard.html";
}

async function loadExtracted() {
    const employee_id = localStorage.getItem("employee_id");
    const status = document.getElementById("filterStatus").value;
    const days = document.getElementById("filterDays").value;

    const res = await fetch(CONFIG.BACKEND + "/api/job/my-extracted-leads", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ employee_id, status, days })
    });

    const data = await res.json();
    const leads = data.leads || [];

    renderLeads(leads);
}

function renderLeads(list) {
    const container = document.getElementById("leadList");

    if (list.length === 0) {
        container.innerHTML = `<p>No leads found.</p>`;
        return;
    }

    container.innerHTML = list.map(L => `
        <div class="lead-card">
            <h3>${L.name}</h3>

            <p><b>${L.phone}</b> — <span class="status ${L.status}">${L.status}</span></p>
            <p>${L.city || ""}, ${L.country || ""}</p>
            <p><i>${L.category || ""}</i></p>

            <button class="call-btn" onclick="startCall('${L.id}')">
                📞 Start Call
            </button>
        </div>
    `).join("");
}

function startCall(id) {
    localStorage.setItem("active_lead_id", id);
    window.location.href = "./call-panel.html";
}

loadExtracted();
