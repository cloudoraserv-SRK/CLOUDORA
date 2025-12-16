console.log("Lead Filters JS Loaded ✓");

// ----------------------------------------------
// CONFIG
// ----------------------------------------------
const API_BASE = "https://cloudora-production.up.railway.app";

let allLeads = [];
let filteredLeads = [];
let selectedLeadIds = [];

let categoryFilters = [];
let cityFilters = [];

const EMPLOYEE_ID = localStorage.getItem("employee_id");

const qs = (id) => document.getElementById(id);

// ----------------------------------------------
// BACK BUTTON
// ----------------------------------------------
function goBack() {
    window.location.href = "./dashboard.html";
}

// ----------------------------------------------
// MAIN SEARCH FUNCTION
// ----------------------------------------------
async function searchLeads() {

    const params = new URLSearchParams({
        search: qs("fCategory").value.trim(), 
        category: qs("fCategory").value.trim(),
        city: qs("fCity").value.trim(),
        country: qs("fCountry").value.trim(),
        freshness: qs("fFreshness").value,
        assigned: qs("fAssigned").value,
        employee_id: EMPLOYEE_ID
    });

    try {
        const res = await fetch(`${API_BASE}/api/extract/raw?${params}`);

        if (!res.ok) {
            alert("Backend not reachable");
            return;
        }

        const json = await res.json();
        console.log("RAW FILTER RESPONSE:", json);

        if (!json.ok) {
            alert("Backend error: Cannot load leads");
            return;
        }

        allLeads = json.leads;
        filteredLeads = [...allLeads];

        qs("leadTable").style.display = "table";

        buildFilterMenus();
        applyFilters();
        renderTable();

    } catch (err) {
        console.error("FILTER ERROR:", err);
        alert("Network error occurred");
    }
}

// ----------------------------------------------
// BUILD CATEGORY + CITY FILTER MENUS
// ----------------------------------------------
function buildFilterMenus() {
    const catMenu = qs("category-filter");
    const cityMenu = qs("city-filter");

    const categories = [...new Set(allLeads.map(l => l.category).filter(Boolean))];
    const cities = [...new Set(allLeads.map(l => l.city).filter(Boolean))];

    // CATEGORY MENU
    catMenu.innerHTML = categories
        .map(c => `<label><input type="checkbox" value="${c}" onchange="toggleFilter('category', this)"> ${c}</label>`)
        .join("");

    // CITY MENU
    cityMenu.innerHTML = cities
        .map(c => `<label><input type="checkbox" value="${c}" onchange="toggleFilter('city', this)"> ${c}</label>`)
        .join("");
}

// ----------------------------------------------
// FILTER CHANGE HANDLER
// ----------------------------------------------
function toggleFilter(type, checkbox) {

    if (type === "category") {
        checkbox.checked
            ? categoryFilters.push(checkbox.value)
            : categoryFilters = categoryFilters.filter(v => v !== checkbox.value);
    }

    if (type === "city") {
        checkbox.checked
            ? cityFilters.push(checkbox.value)
            : cityFilters = cityFilters.filter(v => v !== checkbox.value);
    }

    applyFilters();
}

// ----------------------------------------------
// APPLY FILTERS TO TABLE
// ----------------------------------------------
function applyFilters() {
    filteredLeads = allLeads.filter(l => {

        const catMatch = categoryFilters.length === 0 || categoryFilters.includes(l.category);
        const cityMatch = cityFilters.length === 0 || cityFilters.includes(l.city);

        return catMatch && cityMatch;
    });

    qs("resultCount").innerText = `${filteredLeads.length} leads found`;
    renderTable();
}

// ----------------------------------------------
// SORTING FUNCTION
// ----------------------------------------------
let sortState = {};

function sortBy(key) {

    if (!sortState[key]) sortState[key] = "asc";

    const order = sortState[key];

    filteredLeads.sort((a, b) => {
        const x = (a[key] || "").toString().toLowerCase();
        const y = (b[key] || "").toString().toLowerCase();
        return order === "asc" ? x.localeCompare(y) : y.localeCompare(x);
    });

    sortState[key] = order === "asc" ? "desc" : "asc";

    renderTable();
}

// ----------------------------------------------
// RENDER TABLE ROWS
// ----------------------------------------------
function renderTable() {
    const tbody = qs("leadList");
    tbody.innerHTML = "";

    filteredLeads.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>
                    <input type="checkbox" class="rowCheck" value="${l.id}"
                        onclick="toggleSelect('${l.id}'); event.stopPropagation();">
                </td>

                <td onclick="openPopup('${l.id}')">${l.name || '-'}</td>
                <td onclick="openPopup('${l.id}')">${l.phone || '-'}</td>
                <td onclick="openPopup('${l.id}')">${l.website || '-'}</td>

                <td>${l.category || '-'}</td>
                <td>${l.city || '-'}</td>
            </tr>
        `;
    });
}

// ----------------------------------------------
// SELECT ALL
// ----------------------------------------------
function toggleSelectAll(master) {
    const boxes = document.querySelectorAll(".rowCheck");

    selectedLeadIds = [];

    boxes.forEach(cb => {
        cb.checked = master.checked;
        if (master.checked) selectedLeadIds.push(cb.value);
    });

    qs("assignBtn").style.display =
        selectedLeadIds.length > 0 ? "block" : "none";
}

// ----------------------------------------------
// INDIVIDUAL SELECT
// ----------------------------------------------
function toggleSelect(id) {
    if (selectedLeadIds.includes(id)) {
        selectedLeadIds = selectedLeadIds.filter(x => x !== id);
    } else {
        selectedLeadIds.push(id);
    }

    qs("assignBtn").style.display =
        selectedLeadIds.length > 0 ? "block" : "none";
}

// ----------------------------------------------
// POPUP PREVIEW
// ----------------------------------------------
function openPopup(id) {
    const L = filteredLeads.find(l => l.id === id);
    if (!L) return;

    qs("pName").innerText = L.name || "-";
    qs("pPhone").innerText = L.phone || "-";
    qs("pEmail").innerText = L.email || "-";
    qs("pCity").innerText = L.city || "-";
    qs("pCountry").innerText = L.country || "-";
    qs("pCategory").innerText = L.category || "-";
    qs("pWebsite").href = L.website || "#";

    qs("leadPopup").style.display = "flex";
}

function closePopup() {
    qs("leadPopup").style.display = "none";
}

// ----------------------------------------------
// ASSIGN SELECTED LEADS
// ----------------------------------------------
async function assignSelected() {

    if (selectedLeadIds.length === 0)
        return alert("Please select leads first.");

    const res = await fetch(`${API_BASE}/api/extract/assign-selected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            lead_ids: selectedLeadIds,
            employee_id: EMPLOYEE_ID
        })
    });

    const json = await res.json();

    if (!json.ok) {
        alert("Assignment failed.");
        return;
    }

    alert(`${json.assigned} leads assigned successfully.`);

    selectedLeadIds = [];
    qs("assignBtn").style.display = "none";

    searchLeads(); // Refresh results
}
