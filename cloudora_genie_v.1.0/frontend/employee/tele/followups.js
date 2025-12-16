function goBack() {
    window.location.href = "./dashboard.html";
}

async function loadFollowups() {
    const employee_id = localStorage.getItem("employee_id");
    const range = document.getElementById("filterRange").value;

    const res = await fetch(CONFIG.BACKEND + "/api/job/followups", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ employee_id, range })
    });

    const data = await res.json();
    const list = data.followups || [];

    renderFollowups(list);
}

function renderFollowups(list) {
    const container = document.getElementById("followList");

    if (list.length === 0) {
        container.innerHTML = `<p>No follow-ups in this category.</p>`;
        return;
    }

    container.innerHTML = list.map(L => `
        <div class="follow-card">
            <h3>${L.name}</h3>

            <p><b>${L.phone}</b></p>
            <p>${L.city || ""}, ${L.country || ""}</p>
            <p><i>${L.category || ""}</i></p>

            <p class="due ${L.due_class}">
                ${L.due_text}
            </p>

            <button class="call-btn" onclick="startCall('${L.id}')">
                📞 Call Now
            </button>
        </div>
    `).join("");
}

function startCall(id) {
    localStorage.setItem("active_lead_id", id);
    window.location.href = "./call-panel.html";
}

loadFollowups();
