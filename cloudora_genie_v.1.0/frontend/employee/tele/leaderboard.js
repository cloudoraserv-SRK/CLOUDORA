function goBack() {
    window.location.href = "./dashboard.html";
}

async function loadLeaderboard() {
    const employee_id = localStorage.getItem("employee_id");

    const range = document.getElementById("rangeFilter").value;
    const type = document.getElementById("typeFilter").value;
    const region = document.getElementById("regionFilter").value;

    const res = await fetch(CONFIG.BACKEND + "/api/job/leaderboard", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ employee_id, range, type, region })
    });

    const data = await res.json();
    if (!data.ok) return;

    renderMyRank(data.my_rank);
    renderRanking(data.ranking);
}

function renderMyRank(my) {
    if (!my) {
        document.getElementById("myRankBox").innerHTML = "No rank data.";
        return;
    }

    document.getElementById("myRankBox").innerHTML = `
        <div>
            <p><b>Rank:</b> ${my.position}</p>
            <p><b>Name:</b> ${my.name}</p>
            <p><b>Level:</b> ${my.level}</p>
            <p><b>XP:</b> ${my.xp}</p>
        </div>
    `;
}

function renderRanking(list) {
    const container = document.getElementById("rankingList");

    container.innerHTML = list
        .map((u, i) => `
        <div class="rank-card">
            <div class="rank-left">
                <img src="${u.avatar}" class="rank-photo">
                <div>
                    <div class="rank-name">${u.name}</div>
                    ${
                        u.type === "xp"
                        ? `<div class="rank-xp">XP: ${u.value}</div>`
                        : `<div class="rank-money">₹${u.value}</div>`
                    }
                </div>
            </div>

            <div>
                <div class="rank-pos">${u.position}</div>
                <div class="${u.change_class}">${u.change_icon}</div>
            </div>
        </div>
    `)
    .join("");
}

loadLeaderboard();
