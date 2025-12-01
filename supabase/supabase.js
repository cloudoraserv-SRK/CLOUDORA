// ------------------------------
// Cloudora CRM Supabase Client
// ------------------------------

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

// Create Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------------------------------
// UNIVERSAL INSERT FUNCTION
// -------------------------------------------------
async function insertData(table, data) {
  const { error } = await supabase.from(table).insert([data]);

  if (error) {
    console.error(`❌ Supabase Insert Error (${table}):`, error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// -------------------------------------------------
// UNIVERSAL UPDATE FUNCTION
// -------------------------------------------------
async function updateData(table, match, data) {
  const { error } = await supabase.from(table).update(data).match(match);

  if (error) {
    console.error(`❌ Supabase Update Error (${table}):`, error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// -------------------------------------------------
// UNIVERSAL SELECT FUNCTION
// -------------------------------------------------
async function fetchData(table, match = {}) {
  const { data, error } = await supabase.from(table).select("*").match(match);

  if (error) {
    console.error(`❌ Supabase Select Error (${table}):`, error.message);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
}

// -------------------------------------------------
// LEADS
// -------------------------------------------------
async function createLead(full_name, email, phone, source = "website") {
  return insertData("leads", {
    full_name,
    email,
    phone,
    source,
    created_at: new Date().toISOString()
  });
}

// -------------------------------------------------
// EMPLOYEES
// -------------------------------------------------
async function createEmployee(data) {
  return insertData("employees", data);
}

// -------------------------------------------------
// DEPARTMENTS
// -------------------------------------------------
async function createDepartment(name, description = "") {
  return insertData("departments", { name, description });
}

// -------------------------------------------------
// ROLES
// -------------------------------------------------
async function createRole(name, permissions = {}) {
  return insertData("roles", { name, permissions });
}

// -------------------------------------------------
// TASKS
// -------------------------------------------------
async function assignTask(title, description, assigned_to, assigned_by, due_date) {
  return insertData("tasks", {
    title,
    description,
    assigned_to,
    assigned_by,
    due_date
  });
}

// -------------------------------------------------
// ATTENDANCE
// -------------------------------------------------
async function logAttendance(employee_id, login_time = new Date().toISOString()) {
  return insertData("attendance", { employee_id, login_time });
}

// -------------------------------------------------
// ACTIVITY LOG
// -------------------------------------------------
async function logActivity(employee_id, action, details = "") {
  return insertData("activity_log", {
    employee_id,
    action,
    details,
    created_at: new Date().toISOString()
  });
}

// -------------------------------------------------
// EXPORT TO WINDOW
// -------------------------------------------------
window.supabaseInsert = insertData;
window.supabaseUpdate = updateData;
window.supabaseFetch = fetchData;

window.createLead = createLead;
window.createEmployee = createEmployee;
window.createDepartment = createDepartment;
window.createRole = createRole;
window.assignTask = assignTask;
window.logAttendance = logAttendance;
window.logActivity = logActivity;

console.log("🔥 Cloudora Supabase CRM initialized successfully");
