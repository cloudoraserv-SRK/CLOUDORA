(function () {
  const SESSION_KEY = "cloudora_client_session";
  const TASKS_KEY = "cloudora_client_tasks";
  const welcomeNode = document.getElementById("clientWelcome");
  const taskList = document.getElementById("clientTaskList");
  const taskForm = document.getElementById("clientTaskForm");
  const logoutBtn = document.getElementById("clientLogoutBtn");
  const clearBtn = document.getElementById("clearClientTasksBtn");
  const notifBtn = document.getElementById("requestNotifBtn");
  const blasterBtn = document.getElementById("openMlBlasterClientBtn");

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function getTasks() {
    try {
      return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function redirectToAuth() {
    window.location.href = "./auth.html";
  }

  function formatDate(value) {
    if (!value) return "No schedule";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function renderTasks() {
    const tasks = getTasks().sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
    if (!tasks.length) {
      taskList.innerHTML = "No local tasks saved yet.";
      return;
    }

    taskList.innerHTML = tasks.map((task) => `
      <article class="client-task-card">
        <h3>${task.title}</h3>
        <div class="client-task-meta">
          <div><strong>Role:</strong> ${task.role}</div>
          <div><strong>Schedule:</strong> ${formatDate(task.schedule)}</div>
          <div><strong>Status:</strong> ${task.done ? "Completed" : "Pending"}</div>
          <div><strong>Notes:</strong> ${task.notes || "No notes"}</div>
        </div>
        <div class="client-task-actions">
          <button class="ghost-btn small task-toggle" data-id="${task.id}" type="button">${task.done ? "Mark Pending" : "Mark Done"}</button>
          <button class="ghost-btn small task-delete" data-id="${task.id}" type="button">Delete</button>
        </div>
      </article>
    `).join("");
  }

  function notifyTask(task) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification("Genie Task Due", {
      body: `${task.title} is due now for ${task.role} mode.`,
      icon: "../assets/images/genie.png"
    });
  }

  function runScheduler() {
    const now = Date.now();
    const tasks = getTasks();
    let changed = false;

    const next = tasks.map((task) => {
      if (!task.done && task.schedule && new Date(task.schedule).getTime() <= now) {
        notifyTask(task);
        changed = true;
        return { ...task, done: true, triggeredAt: new Date().toISOString() };
      }
      return task;
    });

    if (changed) {
      saveTasks(next);
      renderTasks();
    }
  }

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const tasks = getTasks();
    tasks.push({
      id: `task_${Date.now()}`,
      title: document.getElementById("taskTitle").value.trim(),
      role: document.getElementById("taskRole").value,
      schedule: document.getElementById("taskSchedule").value,
      notes: document.getElementById("taskNotes").value.trim(),
      done: false,
      createdAt: new Date().toISOString()
    });
    saveTasks(tasks);
    taskForm.reset();
    renderTasks();
  });

  taskList.addEventListener("click", (event) => {
    const toggleBtn = event.target.closest(".task-toggle");
    const deleteBtn = event.target.closest(".task-delete");
    if (!toggleBtn && !deleteBtn) return;

    let tasks = getTasks();
    if (toggleBtn) {
      tasks = tasks.map((task) =>
        task.id === toggleBtn.dataset.id ? { ...task, done: !task.done } : task
      );
    }
    if (deleteBtn) {
      tasks = tasks.filter((task) => task.id !== deleteBtn.dataset.id);
    }
    saveTasks(tasks);
    renderTasks();
  });

  clearBtn.addEventListener("click", () => {
    localStorage.removeItem(TASKS_KEY);
    renderTasks();
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    redirectToAuth();
  });

  notifBtn.addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
  });

  blasterBtn.addEventListener("click", () => {
    const memory = JSON.parse(localStorage.getItem("genie_assistant_local_memory") || "{}");
    window.open(memory.mlblasterUrl || "http://localhost:5000", "_blank", "noopener");
  });

  const session = getSession();
  if (!session?.id) {
    redirectToAuth();
    return;
  }

  welcomeNode.textContent = `${session.business_name || session.name || "Client"} workspace`;
  renderTasks();
  runScheduler();
  window.setInterval(runScheduler, 60000);
})();
