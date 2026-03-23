(() => {
  const adminSession = JSON.parse(localStorage.getItem("cloudora_admin_session") || "null");
  if (!adminSession?.id) {
    window.location.href = "./login.html";
    return;
  }

  const fileInput = document.getElementById("csvfile");
  const uploadBtn = document.getElementById("uploadBtn");
  const assignBtn = document.getElementById("assignBtn");
  const shiftSelect = document.getElementById("shiftSelect");
  const createMemberBtn = document.getElementById("createMemberBtn");
  const refreshMembersBtn = document.getElementById("refreshMembersBtn");
  const membersList = document.getElementById("membersList");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  function genUID() {
    return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function memberPayloadFromForm() {
    return {
      member_id: document.getElementById("memberId").value.trim(),
      access_code: document.getElementById("memberCode").value.trim(),
      name: document.getElementById("memberName").value.trim(),
      tier: document.getElementById("memberTier").value,
      status: document.getElementById("memberStatus").value
    };
  }

  async function createLead(row) {
    return fetch(CONFIG.BACKEND + "/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_uid: genUID(),
        name: row.name || row.fullname || row.Name || "",
        phone: row.phone || row.mobile || "",
        email: row.email || row.Email || "",
        source: row.source || "csv",
        requirement: row.requirement || row.message || "Imported lead"
      })
    });
  }

  uploadBtn.onclick = async () => {
    if (!fileInput.files.length) return alert("Choose CSV");

    const file = fileInput.files[0];
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true }).data.filter(Boolean);

    for (const row of parsed) {
      await createLead(row);
    }

    alert("Leads created");
  };

  assignBtn.onclick = async () => {
    alert(
      `Current shift selected: ${shiftSelect.value}. Lead-to-shift bulk assignment still needs a dedicated backend endpoint for the new task model.`
    );
  };

  function memberCard(member) {
    const profileText = member.profile?.business_name
      ? `${member.profile.business_name}${member.profile.industry ? ` • ${member.profile.industry}` : ""}`
      : "No business profile saved";

    return `
      <div class="launch-card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
          <div>
            <strong style="font-size:1.05rem">${member.name || member.member_id}</strong>
            <div style="margin-top:4px;color:#6f6860">Member ID: ${member.member_id}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="ghost-btn small" style="pointer-events:none">${member.tier}</span>
            <span class="ghost-btn small" style="pointer-events:none">${member.status}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px">
          <div style="padding:12px;border:1px solid rgba(48,44,40,0.08);border-radius:16px;background:rgba(255,255,255,0.65)">
            <div style="font-size:12px;text-transform:uppercase;color:#8c7d74">Profile</div>
            <div style="margin-top:6px">${profileText}</div>
          </div>
          <div style="padding:12px;border:1px solid rgba(48,44,40,0.08);border-radius:16px;background:rgba(255,255,255,0.65)">
            <div style="font-size:12px;text-transform:uppercase;color:#8c7d74">Usage</div>
            <div style="margin-top:6px">${member.usage?.totalUsage || 0} actions</div>
            <div style="margin-top:4px;color:#6f6860;font-size:13px">${member.usage?.lastUsedAt || "Never used"}</div>
          </div>
          <div style="padding:12px;border:1px solid rgba(48,44,40,0.08);border-radius:16px;background:rgba(255,255,255,0.65)">
            <div style="font-size:12px;text-transform:uppercase;color:#8c7d74">Campaigns</div>
            <div style="margin-top:6px">${member.campaigns?.campaignRuns || 0} runs</div>
            <div style="margin-top:4px;color:#6f6860;font-size:13px">Sent ${member.campaigns?.totalSent || 0}, Failed ${member.campaigns?.totalFailed || 0}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px">
          <input data-field="name" data-id="${member.id}" value="${member.name || ""}" placeholder="Name">
          <input data-field="member_id" data-id="${member.id}" value="${member.member_id || ""}" placeholder="Member ID">
          <input data-field="access_code" data-id="${member.id}" placeholder="New access code">
          <select data-field="tier" data-id="${member.id}">
            <option value="pro" ${member.tier === "pro" ? "selected" : ""}>Pro</option>
            <option value="business" ${member.tier === "business" ? "selected" : ""}>Business</option>
            <option value="elite" ${member.tier === "elite" ? "selected" : ""}>Elite</option>
          </select>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="primary-btn small member-save" data-id="${member.id}" data-status="${member.status}">Save Changes</button>
          <button class="ghost-btn small member-status" data-id="${member.id}" data-next="active">Approve</button>
          <button class="ghost-btn small member-status" data-id="${member.id}" data-next="paused">Pause</button>
          <button class="ghost-btn small member-status" data-id="${member.id}" data-next="revoked">Revoke</button>
        </div>
      </div>
    `;
  }

  async function loadMembers() {
    membersList.innerHTML = "Loading members...";
    const response = await fetch(CONFIG.BACKEND + "/api/admin/genie-members");
    const payload = await response.json();

    if (!payload.ok) {
      membersList.innerHTML = payload.error || "Could not load members";
      return;
    }

    if (!payload.members.length) {
      membersList.innerHTML = "No approved members yet.";
      return;
    }

    membersList.innerHTML = payload.members.map(memberCard).join("");
  }

  createMemberBtn.onclick = async () => {
    const payload = memberPayloadFromForm();
    if (!payload.member_id || !payload.access_code) {
      alert("Member ID and access code are required");
      return;
    }

    const response = await fetch(CONFIG.BACKEND + "/api/admin/genie-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    if (!json.ok) {
      alert(json.error || "Could not create member");
      return;
    }

    alert("Genie member saved");
    await loadMembers();
  };

  membersList.onclick = async (event) => {
    const saveBtn = event.target.closest(".member-save");
    const statusBtn = event.target.closest(".member-status");

    if (saveBtn) {
      const id = saveBtn.dataset.id;
      const payload = { id, status: saveBtn.dataset.status };
      membersList.querySelectorAll(`[data-id="${id}"][data-field]`).forEach((field) => {
        const key = field.dataset.field;
        const value = field.value.trim();
        if (value) payload[key] = value;
      });

      const response = await fetch(CONFIG.BACKEND + "/api/admin/genie-members/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (!json.ok) {
        alert(json.error || "Could not update member");
        return;
      }
      alert("Member updated");
      await loadMembers();
      return;
    }

    if (statusBtn) {
      const id = statusBtn.dataset.id;
      const response = await fetch(CONFIG.BACKEND + "/api/admin/genie-members/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: statusBtn.dataset.next
        })
      });
      const json = await response.json();
      if (!json.ok) {
        alert(json.error || "Could not change member status");
        return;
      }
      alert(`Member status changed to ${statusBtn.dataset.next}`);
      await loadMembers();
    }
  };

  refreshMembersBtn.onclick = loadMembers;
  if (adminLogoutBtn) {
    adminLogoutBtn.onclick = () => {
      localStorage.removeItem("cloudora_admin_session");
      window.location.href = "./login.html";
    };
  }
  loadMembers().catch(console.error);
})();
