console.log("Call Panel JS Loaded ✓");

// ---------------------------------------------------------
// GLOBALS
// ---------------------------------------------------------
let ACTIVE_LEAD = null;
let ACTIVE_ASSIGNMENT = null;
let sessionSeconds = 0;
let timerInterval = null;

const API = "https://cloudora-production.up.railway.app";
const EMPLOYEE_ID = localStorage.getItem("employee_id");
const qs = (id) => document.getElementById(id);

// ---------------------------------------------------------
// EXIT
// ---------------------------------------------------------
function exitPanel() {
  if (confirm("Exit calling panel?")) {
    window.location.href = "./dashboard.html";
  }
}

// ---------------------------------------------------------
// TIMER
// ---------------------------------------------------------
function startTimer() {
  timerInterval = setInterval(() => {
    sessionSeconds++;
    qs("sessionTime").innerText =
      `${String(Math.floor(sessionSeconds / 60)).padStart(2, "0")}:` +
      `${String(sessionSeconds % 60).padStart(2, "0")}`;
  }, 1000);
}

// ---------------------------------------------------------
// LOAD NEXT LEAD
// ---------------------------------------------------------
async function loadNextLead() {
  try {
    const res = await fetch(`${API}/api/extract/next-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: EMPLOYEE_ID })
    });

    const json = await res.json();

    if (!json.ok || !json.lead) {
      qs("leadInfo").innerHTML = "<h2>No leads assigned</h2>";
      ACTIVE_LEAD = null;
      ACTIVE_ASSIGNMENT = null;
      return;
    }

    ACTIVE_LEAD = json.lead;
    ACTIVE_ASSIGNMENT = json.assignment_id;

    if (!ACTIVE_LEAD.phone || ACTIVE_LEAD.phone.trim() === "") {
      await completeAssignment("Auto-Skipped (No phone)");
      return loadNextLead();
    }

    renderLead();
    loadScript(ACTIVE_LEAD.category);

  } catch (err) {
    console.error("NEXT LEAD ERROR:", err);
  }
}

// ---------------------------------------------------------
// COMPLETE ASSIGNMENT
// ---------------------------------------------------------
async function completeAssignment(reason, markStatus = "completed") {
  if (!ACTIVE_ASSIGNMENT) return;

  await fetch(`${API}/api/extract/complete-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignment_id: ACTIVE_ASSIGNMENT,
      mark_status: markStatus
    })
  });
}

// ---------------------------------------------------------
// RENDER LEAD
// ---------------------------------------------------------
function renderLead() {
  qs("leadInfo").innerHTML = `
    <h2>${ACTIVE_LEAD.name || "-"}</h2>
    <p><b>Phone:</b> ${ACTIVE_LEAD.phone}</p>
    <p><b>City:</b> ${ACTIVE_LEAD.city || "-"}</p>
    <p><b>Category:</b> ${ACTIVE_LEAD.category || "-"}</p>
  `;
  qs("dialBtn").href = `tel:${ACTIVE_LEAD.phone}`;
}

// ---------------------------------------------------------
// MASTER + CATEGORY SCRIPTS
// ---------------------------------------------------------
const MASTER_INTRO = `
Hello! Main Cloudora team se bol raha hoon.  
Hum businesses aur professionals ko customers, growth aur income opportunities se connect karte hain.

Bas 30 seconds me batane doon — kya ye aapke liye useful ho sakta hai?
`;

const CATEGORY_PITCH = {
  "Real Estate": `
Real estate leads se grow hota hai.  
Cloudora genuine buyer & seller enquiries, marketing aur CRM follow-up support deta hai.

Kya main batun kaise aapki property enquiries badh sakti hain?
`,

  "Restaurants": `
Restaurants ke liye daily customers important hote hain.  
Cloudora walk-ins, online orders aur Google visibility badhata hai.

Kya aap apna daily customer flow badhana chahoge?
`,

  "Education": `
Education institutes admissions se grow karte hain.  
Cloudora student enquiries, branding aur CRM deta hai.

Kya main batun kaise admissions badhengi?
`,

  "Business": `
Har business ko leads aur sales chahiye hoti hain.  
Cloudora lead generation, marketing aur automation deta hai.

Kya aap growth ke liye open ho?
`
};

// ---------------------------------------------------------
// GENIE MEMBERSHIP PITCH
// ---------------------------------------------------------
const GENIE_MEMBERSHIP = `
Ek chhoti si baat sir 👇  
Cloudora Genie ek AI-based membership hai jahan:

• Business owners ko customers  
• Professionals ko growth tools  
• Housewife / creators ko rewards  
• Common users ko learning + earning  

Membership sirf ₹99/month ya ₹999/year.  
Early members ko extra BHIX reward coins milte hain.

Kya main iski details WhatsApp par bhej doon?
`;

// ---------------------------------------------------------
// REPLY MAP (OBJECTION HANDLING)
// ---------------------------------------------------------
const REPLY_MAP = {
  interested: `
Bahut badiya sir 👍  
Main aapki requirement sales team ko forward kar raha hoon.

${GENIE_MEMBERSHIP}
`,

  not_interested: `
Samajh sakta hoon sir 🙂  
Waise Cloudora sirf ads nahi deta, ek complete growth ecosystem hai.

${GENIE_MEMBERSHIP}
`,

  busy: `
Bilkul sir 👍  
Sirf itna bata doon — Cloudora ek AI Genie platform hai jo business aur earning dono me help karta hai.

Main thodi der baad call kar loon?
`,

  whatsapp: `
Perfect sir 👍  
Main WhatsApp par exact details bhej deta hoon.

${GENIE_MEMBERSHIP}
`
};

// ---------------------------------------------------------
// SCRIPT ENGINE
// ---------------------------------------------------------
function loadScript(category) {
  const pitch = CATEGORY_PITCH[category] || CATEGORY_PITCH["Business"];
  qs("scriptContent").innerText = MASTER_INTRO + "\n\n" + pitch;

  const area = qs("responseButtons");
  area.innerHTML = "";

  const buttons = [
    { label: "Interested", type: "interested" },
    { label: "Busy", type: "busy" },
    { label: "Not Interested", type: "not_interested" },
    { label: "Send WhatsApp", type: "whatsapp" }
  ];

  buttons.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "response-btn";
    btn.innerText = b.label;

    btn.onclick = () => {
      qs("replyScript").innerText =
        REPLY_MAP[b.type] || "Thank you sir.";
    };

    area.appendChild(btn);
  });
}

// ---------------------------------------------------------
// SKIP
// ---------------------------------------------------------
async function skipLead() {
  await completeAssignment("Skipped by agent", "skipped");
  loadNextLead();
}


// ---------------------------------------------------------
// FINISH + SALES FORWARD
// ---------------------------------------------------------
async function finishLead() {
  const status = qs("leadStatus").value;
  const notes = qs("leadNotes").value;

  await fetch(`${API}/api/extract/update-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: ACTIVE_LEAD.id,
      status,
      notes
    })
  });

  // ✅ INTERESTED → SALES
  if (status === "interested") {
    await forwardToSales(ACTIVE_LEAD.id);
    await completeAssignment("Forwarded to Sales", "completed");
    return loadNextLead();
  }

  // ✅ CALLBACK / FOLLOW-UP
  if (status === "callback") {
    await completeAssignment("Follow-up scheduled", "pending");
    return loadNextLead();
  }

  // ✅ ALL OTHER CASES
  await completeAssignment(`Finished — ${status}`, "completed");
  loadNextLead();
}

// ---------------------------------------------------------
// FORWARD TO SALES
// ---------------------------------------------------------
async function forwardToSales(lead_id) {
  const sourceDept = localStorage.getItem("employee_department");

  await fetch(`${API}/api/extract/forward-sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id,
      source_department: sourceDept
    })
  });
}

// ---------------------------------------------------------
// CALLBACK UI
// ---------------------------------------------------------
qs("leadStatus").addEventListener("change", () => {
  qs("callbackFields").style.display =
    qs("leadStatus").value === "callback" ? "block" : "none";
});

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
window.onload = () => {
  startTimer();
  loadNextLead();
};
