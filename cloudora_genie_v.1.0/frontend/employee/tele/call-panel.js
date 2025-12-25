/* ---------------------------------------------------------
   GLOBALS
--------------------------------------------------------- */
console.log("Call Panel Survey JS Loaded ✓");

let skippedSteps = new Set();
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
    question: "“Just to understand better, what do you currently do?",
    options: ["Job", "Business", "Student", "Homemaker", "Freelancer"]
  },

 {
  id: "interests_main",
  type: "multi",
  question:
    "“I’ll mention a few areas. Please tell me what’s relevant for you or your family. Which of these areas are currently relevant for you or your family? (You can select multiple)",
  options: [
    "Healthcare & Medicines",
    "Health & Wellness",
    "Daily Home Services",
    "Travel & Hotels",
    "Vehicle (Car / Bike)",
    "Pets & Pet Care",
    "Education & Learning",
    "Job & Career",
    "Business & Startup",
    "Events & Lifestyle",
    "Safety & Security"
  ]
},

{
  id: "healthcare_needs",
  type: "multi",
  condition: (a) => a.interests_main?.includes("Healthcare & Medicines"),
  question:
   "So is this mostly for you or for parents? When do you think you’ll need this? Which healthcare or medicine-related needs apply to you?",
  options: [
    "Daily or regular medicines",
    "Medicines for parents or elderly family members",
    "Upcoming medical checkup",
    "Home sample collection (blood tests, reports)",
    "Doctor consultation (online or local)",
    "Medical equipment (BP machine, sugar monitor)",
    "Emergency medicine availability"
  ]
},
{
  id: "healthcare_timeline",
  type: "single",
  condition: (a) => a.healthcare_needs?.length > 0,
  question: "When do you expect to need these healthcare services?",
  options: [
    "Immediately",
    "Within 1 month",
    "In next 3–6 months",
    "Just exploring"
  ]
},

{
  id: "wellness_needs",
  type: "multi",
  condition: (a) => a.interests_main?.includes("Health & Wellness"),
  question:
    "Which health or wellness services interest you?",
  options: [
    "Online fitness or yoga",
    "Weight management or diet plans",
    "Stress or mental wellness support",
    "Physiotherapy or recovery care",
    "Preventive health programs"
  ]
},

   {
  id: "home_services",
  type: "multi",
  condition: (a) => a.interests_main?.includes("Daily Home Services"),
  question:
    "Which home services do you usually require?",
  options: [
    "House cleaning",
    "Electrician / plumber",
    "AC servicing or repair",
    "Appliance repair",
    "Carpentry or furniture work",
    "Pest control"
  ]
},

{
  id: "travel_plans",
  type: "multi",
  condition: (a) => a.interests_main?.includes("Travel & Hotels"),
  question:
    "Family trip or work-related? Do you have any travel or stay-related plans? Any timeframe in mind?",
  options: [
    "Local travel",
    "Domestic travel",
    "International travel",
    "Hotel bookings",
    "Holiday packages",
    "Business travel"
  ]
},
{
  id: "travel_timeline",
  type: "single",
  condition: (a) => a.travel_plans?.length > 0,
  question: "When are you planning this travel?",
  options: [
    "Within 1 month",
    "1–3 months",
    "Later this year",
    "Just checking options"
  ]
},

   {
  id: "vehicle_needs",
  type: "multi",
  condition: (a) => a.interests_main?.includes("Vehicle (Car / Bike)"),
  question:
    "Which vehicle-related services are relevant for you?",
  options: [
    "Buying a new car or bike",
    "Buying a used car or bike",
    "Vehicle servicing or repair",
    "Insurance renewal",
    "Accessories or upgrades"
  ]
},

   
{
  id: "pet_interest",
  type: "single",
  condition: (a) => a.interests_main?.includes("Pets & Pet Care"),
  question: "Do you currently have a pet?",
  options: ["Yes", "Planning to get one", "No"]
},
{
  id: "pet_services",
  type: "multi",
  condition: (a) => a.pet_interest === "Yes",
  question:
    "Which pet-related services would be useful?",
  options: [
    "Pet food delivery",
    "Veterinary consultation",
    "Pet grooming",
    "Pet accessories",
    "Pet training"
  ]
},

   {
  id: "pet_services",
  type: "multi",
  condition: (a) => a.pet_interest === "Yes",
  question:
    "Which pet-related services would be useful?",
  options: [
    "Pet food delivery",
    "Veterinary consultation",
    "Pet grooming",
    "Pet accessories",
    "Pet training"
  ]
},

   {
  id: "education_services",
  type: "multi",
  condition: (a) => a.interests_main?.includes("Education & Learning"),
  question:
    "Which education or learning services are relevant?",
  options: [
    "Online courses or skill learning",
    "Student tutoring",
    "Career guidance",
    "Professional certifications",
    "Language learning"
  ]
},

{
  id: "business_services",
  type: "multi",
  condition: (a) => a.interests_main?.includes("Business & Professional Services"),
  question:
    "From a business or professional perspective, what would help you?",
  options: [
    "Digital marketing",
    "Website or app development",
    "Lead generation",
    "Business listing & promotion",
    "Accounting or compliance support",
    "CRM or automation tools"
  ]
},
{
  id: "events_security",
  type: "multi",
  condition: (a) =>
    a.interests_main?.includes("Events & Lifestyle") ||
    a.interests_main?.includes("Safety & Security"),
  question:
    "Any of these services useful for you?",
  options: [
    "Wedding or event management",
    "Birthday or private events",
    "Corporate events",
    "Security guards",
    "CCTV or safety systems",
    "Fire safety equipment"
  ]
},
{
  id: "career_interest",
  type: "single",
  question:
    "Are you open to better opportunities or learning new skills? Are you currently looking for any job or career-related opportunities?",
  options: [
    "Yes, full-time job",
    "Yes, part-time or freelance work",
    "Exploring better opportunities",
    "Not at the moment"
  ]
},
{
  id: "job_preferences",
  type: "multi",
  condition: (a) =>
    a.career_interest !== "Not at the moment",
  question:
    "What kind of work opportunities are you interested in?",
  options: [
    "Office / corporate jobs",
    "Remote or work-from-home jobs",
    "Field or on-ground work",
    "Skill-based freelance work",
    "Internship or training-based roles",
    "Customer support / sales roles"
  ]
},
{
  id: "job_support",
  type: "multi",
  condition: (a) => a.job_preferences?.length > 0,
  question:
    "Which kind of support would help you in your job search?",
  options: [
    "Job listings and alerts",
    "Resume or profile improvement",
    "Interview preparation",
    "Skill training or upskilling",
    "Career guidance or mentoring",
    "Local job opportunities"
  ]
},
{
  id: "business_stage",
  type: "single",
  question:
    "Which best describes your current business situation?",
  options: [
    "I already run a business",
    "I am planning to start a business",
    "I am exploring startup ideas",
    "I am not interested in business currently"
  ]
},
{
  id: "business_plans",
  type: "multi",
  condition: (a) =>
    a.business_stage === "I am planning to start a business" ||
    a.business_stage === "I am exploring startup ideas",
  question:
    "What kind of business are you thinking of starting?",
  options: [
    "Service-based business",
    "Online or digital business",
    "Local shop or franchise",
    "Manufacturing or trading",
    "Startup or tech-based business",
    "Not decided yet"
  ]
},
{
  id: "business_expansion",
  type: "multi",
  condition: (a) => a.business_stage === "I already run a business",
  question:
    "What would you like to improve or expand in your existing business?",
  options: [
    "Getting more customers or leads",
    "Online presence (website, social media)",
    "Digital marketing or advertising",
    "Operations or process improvement",
    "Hiring staff or freelancers",
    "Business automation or CRM tools"
  ]
},
{
  id: "business_support",
  type: "multi",
  condition: (a) =>
    a.business_stage !== "I am not interested in business currently",
  question:
    "Which type of support would be useful for your business or startup?",
  options: [
    "Business registration or compliance guidance",
    "Website or app development",
    "Marketing and promotion",
    "Customer management (CRM)",
    "AI tools for planning and growth",
    "Local visibility and partnerships"
  ]
},
{
  id: "business_timeline",
  type: "single",
  condition: (a) =>
    a.business_stage === "I already run a business" ||
    a.business_stage === "I am planning to start a business",
  question:
    "When are you planning to take action on this?",
  options: [
    "Immediately",
    "Within 1–3 months",
    "In next 6 months",
    "Just exploring for now"
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
  id: "pricing_interest",
  type: "single",
  question:
    "If these services are available at better quality and lower prices, would you be interested?",
  options: ["Yes", "Maybe", "No"]
},
{
  id: "affiliate_interest",
  type: "single",
  question:
    "If you ever want to offer services or grow professionally, would you like to register with Cloudora for free?",
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
  try {
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
  } catch (err) {
    console.error("Load lead failed", err);
  }
}

/* ---------------------------------------------------------
   RENDER LEAD
--------------------------------------------------------- */
function renderLead() {
  qs("leadInfo").innerHTML = `
    <h2>${ACTIVE_LEAD.name || "-"}</h2>
    <p><b>Phone:</b> ${ACTIVE_LEAD.phone || "-"}</p>
    <p><b>City:</b> ${ACTIVE_LEAD.city || "-"}</p>
    <p><b>Source:</b> ${ACTIVE_LEAD.source || "-"}</p>
  `;
  qs("dialBtn").href = `tel:${ACTIVE_LEAD.phone}`;
}

/* ---------------------------------------------------------
   SURVEY ENGINE
--------------------------------------------------------- */
function resetSurvey() {
  surveyStep = 0;
  surveyAnswers = {};
  skippedSteps.clear();
  qs("nextBtn").disabled = false;
}

/* ---------------------------------------------------------
   RENDER SURVEY STEP
--------------------------------------------------------- */
function renderSurveyStep() {
  const step = SURVEY_FLOW[surveyStep];
  if (!step) return;

  qs("currentStep").innerText = surveyStep + 1;
  qs("totalSteps").innerText = SURVEY_FLOW.length;
  qs("optionsBox").innerHTML = "";

  qs("backBtn").style.display = surveyStep === 0 ? "none" : "inline-block";
  qs("nextBtn").style.display =
    surveyStep === SURVEY_FLOW.length - 1 ? "none" : "inline-block";
  qs("nextBtn").disabled = true;

  // Conditional skip
  if (step.condition && !step.condition(surveyAnswers)) {
    skippedSteps.add(surveyStep);
    surveyStep++;
    return renderSurveyStep();
  }

  qs("questionBox").innerText = step.text || step.question;

  if (step.type === "info") {
    qs("nextBtn").disabled = false;
    return;
  }

  step.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => selectAnswer(step, opt, btn);
    qs("optionsBox").appendChild(btn);
  });
}

/* ---------------------------------------------------------
   SELECT ANSWER + AUTO SAVE
--------------------------------------------------------- */
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

  // 🔥 AUTO SAVE (SCRAPED LEAD)
  try {
    await fetch(`${API}/api/extract/update-scraped-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scraped_lead_id: ACTIVE_LEAD.id,
        survey_data: surveyAnswers
      })
    });
  } catch {
    console.warn("Auto-save failed (offline)");
  }
}

/* ---------------------------------------------------------
   NEXT / BACK
--------------------------------------------------------- */
qs("nextBtn").onclick = () => {
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
   COMPLETE / SKIP
--------------------------------------------------------- */
async function completeAssignment(reason, status) {
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

async function skipLead() {
  await completeAssignment("Skipped by agent", "skipped");
  loadNextLead();
}

/* ---------------------------------------------------------
   FINISH LEAD
--------------------------------------------------------- */
async function finishLead() {
  if (!ACTIVE_ASSIGNMENT || !ACTIVE_LEAD) {
    alert("No active lead");
    return;
  }

  try {
    await completeAssignment("Survey Completed", "completed");

    await fetch(`${API}/api/extract/update-scraped-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scraped_lead_id: ACTIVE_LEAD.id,
        status: "interested",
        survey_data: surveyAnswers,
        survey_completed_at: new Date().toISOString()
      })
    });

    loadNextLead();
  } catch {
    alert("Internet issue. Retry.");
  }
}

/* ---------------------------------------------------------
   LANGUAGE SWITCHER
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
window.onload = () => {
  startTimer();
  loadNextLead();
};

