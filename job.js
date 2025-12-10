// -----------------------------------------------
// Cloudora Genie - JOB APPLICATION (FINAL FINAL)
// -----------------------------------------------

document.getElementById("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // ----- READ SAFE VALUES -----
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const city = document.getElementById("city").value.trim();
  const gender = document.getElementById("gender").value;
  const dob = document.getElementById("dob").value;

  const department = document.getElementById("department").value;
  const jobType = document.getElementById("jobType").value;
  const shift = document.getElementById("shift").value;
  const country = document.getElementById("country").value;

  const experience = document.getElementById("experience").value.trim();
  const skills = document.getElementById("skills").value;
  const languages = document.getElementById("languages").value.trim();
  const why = document.getElementById("why").value.trim();

  const applyEmployee = document.getElementById("applyEmployee").checked;


  // ----------------------------------------
  // VALIDATION
  // ----------------------------------------
  if (!name || name.length < 3) return showErr("err-name");
  if (!/^[0-9]{10}$/.test(phone)) return showErr("err-phone");

  if (!email.includes("@") || !email.includes(".")) {
    return showErr("err-email");
  }

  if (!city) return showErr("err-city");
  if (!gender) return showErr("err-gender");
  if (!dob) return showErr("err-dob");

  if (!department) return showErr("err-dept");
  if (!jobType) return showErr("err-jobType");
  if (!shift) return showErr("err-shift");
  if (!country) return showErr("err-country");

  if (experience === "" || Number(experience) < 0) return showErr("err-exp");
  if (!skills) return showErr("err-skills");
  if (!languages) return showErr("err-lang");

  if (!why || why.split(" ").length < 5) return showErr("err-why");

  hideAllErrors();


  // ----------------------------------------
  // SEND DATA TO BACKEND
  // ----------------------------------------
  const payload = {
    name,
    phone,
    email,
    city,
    gender,
    dob,
    department,
    jobType,
    shift,
    country,
    experience,
    skills,
    languages,
    why,
    apply_for_employee: applyEmployee   // IMPORTANT FIX
  };

  try {
    const res = await fetch(`${CONFIG.BACKEND}/api/job/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const out = await res.json();
    console.log("APPLY RESPONSE:", out);

    if (out.ok) {
      window.location.href = `./agreement.html?lead=${out.lead.lead_uid}`;
    } else {
      alert("Application failed: " + (out.error || "Unknown error"));
    }

  } catch (err) {
    console.error(err);
    alert("Network error. Please try again.");
  }
});


// -----------------------------------------------
// ERROR UTILITIES
// -----------------------------------------------
function showErr(id) {
  hideAllErrors();
  document.getElementById(id).style.display = "block";
}

function hideAllErrors() {
  document.querySelectorAll(".error-label").forEach(e => e.style.display = "none");
}
