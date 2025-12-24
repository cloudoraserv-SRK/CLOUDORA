console.log("Call Panel Survey JS Loaded ✓");
let skippedSteps = new Set();

/* ---------------------------------------------------------
   GLOBALS
--------------------------------------------------------- */
let ACTIVE_LEAD = null;
let ACTIVE_ASSIGNMENT = null;
let sessionSeconds = 0;

const API = "https://cloudora-production.up.railway.app";
const EMPLOYEE_ID = localStorage.getItem("employee_id");
const qs = (id) => document.getElementById(id);

/* ---------------------------------------------------------
   SURVEY FLOW (ENGLISH MASTER – EXPANDED SERVICES)
--------------------------------------------------------- */
const SURVEY_FLOW = [
  {
    id: "intro",
    type: "info",
    text:
      "Hello! My name is (your_name) and my employee code is(your EC).I am calling from Cloudora.\n\n" +
      "Cloudora is an upcoming multi-service platform where daily services, learning, and business solutions are available in one place at better prices.\n\n" +
      "In exchange for this 2–3 minute survey, you will receive $1 worth of BHIX Coin and 1 month of Genie AI access for FREE.\n\n" +
      "May I start the survey?\n\n" +
      "If yes, Alright Sir/ Mam this call will be recorded for quality and training purpose."
  },

  {
    id: "profession",
    type: "single",
    question: "What do you currently do?",
    options: ["Job", "Business", "Student", "Homemaker", "Freelancer"]
  },

  {
    id: "interests",
    type: "multi",
    question:
      "Which of the following services might you be interested in? (You can choose multiple)",
    options: [
      "Dance / Fitness (online classes)",
      "Plants / Gardening / Vastu plants",
      "Fire Safety (fire extinguisher, safety tools)",
      "Tattoo services (verified studios)",
      "Daily Home Services (cleaning, repair, etc.)",
      "Event Management (weddings, parties, corporate events)",
      "Tours & Travel Services (local, domestic, international)",
      "Security Services (guards, CCTV, safety support)"
    ]
  },

  {
    id: "business_services",
    type: "multi",
    condition: (a) => a.profession === "Business" || a.profession === "Job",
    question:
      "From a professional or business point of view, are you interested in any of these services?",
    options: [
      "Digital Marketing",
      "Social Media Advertising",
      "SEO",
      "Website / App Development",
      "Online Product or Service Listing",
      "Event Promotion & Management",
      "Travel Booking & Corporate Travel",
      "Security Services for Office / Site"
    ]
  },

  {
    id: "affiliate_interest",
    type: "single",
    question:
      "If you run a business or provide any service (including events, travel, security, or daily services),\n" +
      "would you like to register with Cloudora for FREE?\n\n" +
      "You will receive local promotion, customer enquiries, and Genie AI support.",
    options: ["Yes", "Maybe", "No"]
  },

  {
    id: "pricing",
    type: "single",
    question:
      "If all these services are available at better quality and lower prices than the market, would you be interested?",
    options: ["Yes", "Maybe", "No"]
  },

  {
    id: "bhix_info",
    type: "info",
    text:
      "Important information:\n\n" +
      "BHIX Coin is an upcoming reward-based crypto coin. Its presale starts on 26 January.\n\n" +
      "BHIX Coins are available only to Cloudora members such as registered users, businesses, partners, and freelancers.\n\n" +
      "These coins can be used in the future to access services within the Cloudora and Beggar Index ecosystem."
  },

  {
    id: "genie_info",
    type: "info",
    text:
      "Genie is Cloudora’s AI assistant that:\n" +
      "• Understands your interests\n" +
      "• Suggests the right services\n" +
      "• Compares prices\n" +
      "• Helps with planning and reminders\n\n" +
      "You are receiving 1 month of Genie access for FREE."
  },

  {
    id: "closing",
    type: "info",
    text:
      "🎉 Congratulations!\n\n" +
      "You have successfully completed the survey.\n\n" +
      "You will soon receive:\n" +
      "• BHIX Coin reward\n" +
      "• Genie AI access\n\n" +
      "Your feedback helps us improve services like events, travel, security, and daily needs for everyone.\n\n" +
      "Thank you for your valuable time!"
  }
];

let surveyStep = 0;
let surveyAnswers = {};

/* ---------------------------------------------------------
   EXIT
--------------------------------------------------------- */
function exitPanel() {
  if (confirm("Exit calling panel?")) {
    window.location.href = "./dashboard.html";
  }
}

/* ---------------------------------------------------------
   TIMER
--------------------------------------------------------- */
function startTimer() {
  setInterval(() => {
    sessionSeconds++;
    qs("sessionTime").innerText =
      `${String(Math.floor(sessionSeconds / 60)).padStart(2, "0")}:` +
      `${String(sessionSeconds % 60).padStart(2, "0")}`;
  }, 1000);
}

/* ---------------------------------------------------------
   LOAD NEXT LEAD
--------------------------------------------------------- */
async function loadNextLead() {
  const res = await fetch(`${API}/api/extract/next-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id: EMPLOYEE_ID })
  });

  const json = await res.json();

  if (!json.ok || !json.lead) {
    qs("leadInfo").innerHTML = "<h2>No leads assigned</h2>";
    return;
  }

  ACTIVE_LEAD = json.lead;
  ACTIVE_ASSIGNMENT = json.assignment_id;

  if (!ACTIVE_LEAD.phone) {
    await completeAssignment("No phone", "skipped");
    return loadNextLead();
  }

  renderLead();
  resetSurvey();
  renderSurveyStep();
}
// Render Survey Steps

function renderSurveyStep() {
  const step = SURVEY_FLOW[surveyStep];
  if (!step) return;

  qs("currentStep").innerText = surveyStep + 1;
  qs("totalSteps").innerText = SURVEY_FLOW.length;

  qs("optionsBox").innerHTML = "";

  const isLastStep = surveyStep === SURVEY_FLOW.length - 1;

  // Back button
  qs("backBtn").style.display = surveyStep === 0 ? "none" : "inline-block";

  // Next button
  qs("nextBtn").style.display = isLastStep ? "none" : "inline-block";
  qs("nextBtn").disabled = true;

  // Conditional skip
  if (step.condition && !step.condition(surveyAnswers)) {
  skippedSteps.add(surveyStep);
  surveyStep++;
  return renderSurveyStep();
}


  qs("questionBox").innerText = step.text || step.question;

  // Info step
  if (step.type === "info") {
    qs("nextBtn").disabled = false;
    return;
  }

  // Options
  step.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => selectAnswer(step, opt, btn);
    qs("optionsBox").appendChild(btn);
  });
}

/* ---------------------------------------------------------
   COMPLETE ASSIGNMENT
--------------------------------------------------------- */
async function completeAssignment(reason, status = "completed") {
  if (!ACTIVE_ASSIGNMENT) return;

  await fetch(`${API}/api/extract/complete-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignment_id: ACTIVE_ASSIGNMENT,
      mark_status: status,
      reason
    })
  });
}

/* ---------------------------------------------------------
   RENDER LEAD
--------------------------------------------------------- */
function renderLead() {
  qs("leadInfo").innerHTML = `
    <h2>${ACTIVE_LEAD.name || "-"}</h2>
    <p><b>Phone:</b> ${ACTIVE_LEAD.phone}</p>
    <p><b>City:</b> ${ACTIVE_LEAD.city || "-"}</p>
    <p><b>Category:</b> ${ACTIVE_LEAD.category || "-"}</p>
  `;
  qs("dialBtn").href = `tel:${ACTIVE_LEAD.phone}`;
}

/* ---------------------------------------------------------
   SURVEY ENGINE
--------------------------------------------------------- */
function resetSurvey() {
  surveyStep = 0;
  surveyAnswers = {};
  skippedSteps.clear(); // ✅ ADD THIS
  qs("nextBtn").disabled = false;
}

async function selectAnswer(step, value, btn) {
  if (step.type === "multi") {
    surveyAnswers[step.id] = surveyAnswers[step.id] || [];
    if (surveyAnswers[step.id].includes(value)) {
      surveyAnswers[step.id] =
        surveyAnswers[step.id].filter(v => v !== value);
      btn.classList.remove("selected");
    } else {
      surveyAnswers[step.id].push(value);
      btn.classList.add("selected");
    }
  } else {
    surveyAnswers[step.id] = value;
    document
      .querySelectorAll("#optionsBox button")
      .forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  }

  qs("nextBtn").disabled = false;

  // 🔥 AUTO SAVE EACH STEP
  await fetch(`${API}/api/extract/update-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: ACTIVE_LEAD.id,
      survey_data: surveyAnswers
    })
  });
}

/* ---------------------------------------------------------
   NEXT
--------------------------------------------------------- */
qs("nextBtn").onclick = async () => {
  // 🔒 LAST STEP PAR NEXT DISABLED
  if (surveyStep >= SURVEY_FLOW.length - 1) return;

  surveyStep++;
  renderSurveyStep();
};

qs("backBtn").onclick = () => {
  do {
    surveyStep--;
  } while (skippedSteps.has(surveyStep));

  if (surveyStep < 0) surveyStep = 0;
  renderSurveyStep();
};

/* ---------------------------------------------------------
   SKIP
--------------------------------------------------------- */
async function skipLead() {
  await completeAssignment("Skipped by agent", "skipped");
  loadNextLead();
}

// language slector // 
document.getElementById("languageSwitcher")?.addEventListener("change", (e) => {
  const lang = e.target.value;
  if (!lang) return;

  const wait = setInterval(() => {
    const select = document.querySelector("select.goog-te-combo");
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
      clearInterval(wait);
    }
  }, 300);
});

async function finishLead() {
  if (!ACTIVE_ASSIGNMENT || !ACTIVE_LEAD) {
    alert("No active lead");
    return;
  }

  // 🔒 Mark survey completed
  await completeAssignment("Survey Completed", "completed");

  // 🔐 Optional: mark lead status
  await fetch(`${API}/api/extract/update-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: ACTIVE_LEAD.id,
      status: "interested",
      survey_data: surveyAnswers
    })
  });

  // ➡️ Load next lead
  loadNextLead();
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
window.onload = () => {
  startTimer();
  loadNextLead();
};

