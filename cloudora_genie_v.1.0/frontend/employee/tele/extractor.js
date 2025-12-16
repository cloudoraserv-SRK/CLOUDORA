function goBack() {
    window.location.href = "./dashboard.html";
}

function getSelectedCategory() {
    return document.getElementById("customCategory").value.trim()
        || document.getElementById("popularCategory").value.trim();
}

function getSelectedCity() {
    return document.getElementById("customCity").value.trim()
        || document.getElementById("popularCity").value.trim();
}

function showProgress(p) {
    document.getElementById("progressBox").classList.remove("hidden");
    document.getElementById("progressText").innerText = `Extracting... ${p}%`;
    document.getElementById("progressFill").style.width = p + "%";
}

function showResult(text) {
    let box = document.getElementById("resultBox");
    box.classList.remove("hidden");
    box.innerHTML = text;
}

async function startExtraction() {
    const category = getSelectedCategory();
    const city = getSelectedCity();
    const mode = document.querySelector("input[name='mode']:checked").value;
    const employee_id = localStorage.getItem("employee_id");

    if (!category || !city) {
        alert("Please select both category and city.");
        return;
    }

    showProgress(10);

    if (mode === "live") {
        // --- LIVE SERP API EXTRACTION ---
        showProgress(30);

        const res = await fetch(CONFIG.BACKEND + "/api/extract/live", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, city, employee_id })
        });

        const data = await res.json();

        showProgress(100);

        showResult(`
    <h3>✔ Extraction Completed</h3>
    <p><b>Raw Saved:</b> ${data.saved ?? 0}</p>
    <p><b>Assigned to You:</b> ${data.assigned ?? 0}</p>
    <button onclick="goToCalls()" class="extract-btn">Start Calling</button>
`);
    }

    else {
        // --- EXISTING DATABASE EXTRACTION ---
        showProgress(30);

        const res = await fetch(CONFIG.BACKEND + "/api/extract/from-db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, city, employee_id })
        });

        const data = await res.json();

        showProgress(100);

        showResult(`
            <h3>✔ Leads Assigned From Database</h3>
            <p>Total Assigned: ${data.assigned}</p>
            <button onclick="goToCalls()" class="extract-btn">Start Calling</button>
        `);
    }
}

function goToCalls() {
    window.location.href = "./call-panel.html";
}
