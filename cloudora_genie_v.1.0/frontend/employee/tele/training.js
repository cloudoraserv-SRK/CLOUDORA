function goBack() {
    window.location.href = "./dashboard.html";
}

let ALL_LESSONS = [];

async function loadTraining() {
    const employee_id = localStorage.getItem("employee_id");

    const res = await fetch(CONFIG.BACKEND + "/api/training/list", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ employee_id })
    });

    const data = await res.json();
    ALL_LESSONS = data.lessons || [];

    document.getElementById("totalLessons").innerText = ALL_LESSONS.length;
    document.getElementById("completedLessons").innerText = data.completed;

    let pct = (data.completed / ALL_LESSONS.length) * 100;
    document.getElementById("progressFill").style.width = pct + "%";
}

function openCategory(cat) {
    let filtered = ALL_LESSONS.filter(L => L.category === cat);
    renderLessons(filtered);
}

function renderLessons(list) {
    const box = document.getElementById("lessonList");

    if (list.length === 0) {
        box.innerHTML = `<p>No lessons found in this category.</p>`;
        return;
    }

    box.innerHTML = list.map(L => `
        <div class="lesson-card">
            <div class="lesson-title">${L.title}</div>
            <p>${L.short_desc}</p>

            <div class="lesson-actions">
                <button class="play-btn" onclick="playLesson('${L.id}')">▶ Play</button>
                <button class="quiz-btn" onclick="startQuiz('${L.id}')">📝 Quiz</button>
            </div>
        </div>
    `).join("");
}

function playLesson(id) {
    localStorage.setItem("lesson_id", id);
    window.location.href = "./training-player.html";
}

function startQuiz(id) {
    localStorage.setItem("quiz_id", id);
    window.location.href = "./training-quiz.html";
}

loadTraining();
