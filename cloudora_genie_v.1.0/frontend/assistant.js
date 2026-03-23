(function () {
  const API_BASE = window.CONFIG?.BACKEND || "";
  const STORAGE_KEY = "genie_assistant_profile";
  const SESSION_KEY = "genie_assistant_session";
  const MEMORY_KEY = "genie_assistant_local_memory";
  const ACCESS_KEY = "genie_access_state";
  const MEMBER_TOKEN_KEY = "genie_member_token";
  const CLIENT_ID_KEY = "genie_client_id";

  const profileForm = document.getElementById("profileForm");
  const resetProfileBtn = document.getElementById("resetProfileBtn");
  const memoryForm = document.getElementById("memoryForm");
  const resetMemoryBtn = document.getElementById("resetMemoryBtn");
  const accessForm = document.getElementById("accessForm");
  const accessBadge = document.getElementById("accessBadge");
  const sessionTierBadge = document.getElementById("sessionTierBadge");
  const listenBtn = document.getElementById("listenBtn");
  const openBlasterBtn = document.getElementById("openBlasterBtn");
  const voiceToggleBtn = document.getElementById("voiceToggleBtn");
  const newSessionBtn = document.getElementById("newSessionBtn");
  const chatForm = document.getElementById("chatForm");
  const messageInput = document.getElementById("messageInput");
  const chatLog = document.getElementById("chatLog");
  const statusText = document.getElementById("statusText");
  const avatarWrap = document.getElementById("avatarWrap");
  const roleSelector = document.getElementById("roleSelector");
  const roleBadge = document.getElementById("roleBadge");
  const roleTitle = document.getElementById("roleTitle");
  const roleCaption = document.getElementById("roleCaption");
  const avatarImage = document.getElementById("avatarImage");
  const avatarRoleTag = document.getElementById("avatarRoleTag");
  const avatarRoleSignal = document.getElementById("avatarRoleSignal");
  const modeBadge = document.getElementById("modeBadge");
  const quickPrompts = document.getElementById("quickPrompts");
  const approvalState = document.getElementById("approvalState");
  const trialUsageText = document.getElementById("trialUsageText");
  const workspaceState = document.getElementById("workspaceState");
  const workspaceSection = document.getElementById("workspaceSection");
  const workspaceHeading = document.getElementById("workspaceHeading");
  const workspaceCopy = document.getElementById("workspaceCopy");
  const workspaceTierBadge = document.getElementById("workspaceTierBadge");
  const usageHeadline = document.getElementById("usageHeadline");
  const usageHint = document.getElementById("usageHint");
  const usageFill = document.getElementById("usageFill");

  let sessionId = localStorage.getItem(SESSION_KEY) || "";
  let voiceEnabled = true;
  let isStreaming = false;
  let activeRole = "assistant";
  let usageState = {
    trialDailyChatLimit: 8,
    trialUsedToday: 0,
    trialRemaining: 8,
    fullAccess: false,
    trialMode: true
  };
  let accessState = getAccessState();

  const ROLE_COPY = {
    assistant: {
      badge: "Assistant",
      title: "Business Growth Mode",
      caption: "Marketing planning, outreach drafting, and execution guidance.",
      image: "assets/images/genie.png",
      tag: "Assistant Core"
    },
    sales: {
      badge: "Sales",
      title: "Lead Conversion Mode",
      caption: "Pitch framing, follow-up logic, and closing-focused communication.",
      image: "assets/images/cloud1.png",
      tag: "Sales Mode"
    },
    trainer: {
      badge: "Trainer",
      title: "Knowledge Coach Mode",
      caption: "Scripts, SOP support, and employee learning guidance.",
      image: "assets/images/cloud2.png",
      tag: "Trainer Mode"
    },
    support: {
      badge: "Support",
      title: "Issue Resolution Mode",
      caption: "Structured help, response drafting, and escalation-ready communication.",
      image: "assets/images/genie.png",
      tag: "Support Desk"
    }
  };

  function makeClientId() {
    return `gc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function getClientId() {
    let clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = makeClientId();
      localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }

  function setStatus(text) {
    statusText.textContent = text;
  }

  function setTalking(talking) {
    avatarWrap.classList.toggle("is-talking", talking);
    if (talking) avatarWrap.classList.remove("is-thinking");
  }

  function setThinking(thinking) {
    avatarWrap.classList.toggle("is-thinking", thinking);
    if (thinking) avatarWrap.classList.remove("is-talking");
  }

  function toProfileFormShape(profile = {}) {
    return {
      businessName: profile.businessName || profile.business_name || "",
      ownerName: profile.ownerName || profile.owner_name || "",
      industry: profile.industry || "",
      targetAudience: profile.targetAudience || profile.target_audience || "",
      goals: profile.goals || "",
      platforms: Array.isArray(profile.platforms) ? profile.platforms.join(", ") : profile.platforms || "",
      tone: profile.tone || "",
      postingFrequency: profile.postingFrequency || profile.posting_frequency || "",
      language: profile.language || document.documentElement.lang || "en"
    };
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function getLocalMemory() {
    try {
      return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function openMlBlasterDashboard() {
    const memory = getLocalMemory();
    const url = memory.mlblasterUrl || "http://localhost:5000";
    window.open(url, "_blank", "noopener");
  }

  function saveLocalMemory(memory) {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  }

  function getAccessState() {
    try {
      return JSON.parse(
        localStorage.getItem(ACCESS_KEY) ||
          '{"memberId":"","membershipTier":"free","accessCode":"","fullAccess":false,"trialMode":true}'
      );
    } catch {
      return { memberId: "", membershipTier: "free", accessCode: "", fullAccess: false, trialMode: true };
    }
  }

  function saveAccessState(state) {
    accessState = state;
    localStorage.setItem(ACCESS_KEY, JSON.stringify(state));
  }

  function getMemberToken() {
    return localStorage.getItem(MEMBER_TOKEN_KEY) || "";
  }

  function setMemberToken(token) {
    if (token) {
      localStorage.setItem(MEMBER_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(MEMBER_TOKEN_KEY);
  }

  function fillProfile(profile) {
    const shaped = toProfileFormShape(profile);
    [
      "businessName",
      "ownerName",
      "industry",
      "targetAudience",
      "goals",
      "platforms",
      "tone",
      "postingFrequency"
    ].forEach((key) => {
      const input = document.getElementById(key);
      if (input) input.value = shaped[key] || "";
    });
    saveProfile(shaped);
  }

  function fillLocalMemory(memory) {
    [
      "mlblasterUrl",
      "emailAccountId",
      "emailPassword",
      "instagramHandle",
      "facebookPage",
      "whatsappNumber"
    ].forEach((key) => {
      const input = document.getElementById(key);
      if (input) input.value = memory[key] || "";
    });
  }

  function fillAccessState(state) {
    const memberIdInput = document.getElementById("memberId");
    const tierInput = document.getElementById("membershipTier");
    const codeInput = document.getElementById("accessCode");
    if (memberIdInput) memberIdInput.value = state.memberId || "";
    if (tierInput) tierInput.value = state.membershipTier || "free";
    if (codeInput) codeInput.value = state.accessCode || "";
    applyAccessBadges(state);
  }

  function readProfileForm() {
    return {
      businessName: document.getElementById("businessName").value.trim(),
      ownerName: document.getElementById("ownerName").value.trim(),
      industry: document.getElementById("industry").value.trim(),
      targetAudience: document.getElementById("targetAudience").value.trim(),
      goals: document.getElementById("goals").value.trim(),
      platforms: document.getElementById("platforms").value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      tone: document.getElementById("tone").value.trim(),
      postingFrequency: document.getElementById("postingFrequency").value.trim(),
      language: document.documentElement.lang || "en"
    };
  }

  function readLocalMemoryForm() {
    const memory = {
      mlblasterUrl: document.getElementById("mlblasterUrl").value.trim(),
      emailAccountId: document.getElementById("emailAccountId").value.trim(),
      emailPassword: document.getElementById("emailPassword").value.trim(),
      instagramHandle: document.getElementById("instagramHandle").value.trim(),
      facebookPage: document.getElementById("facebookPage").value.trim(),
      whatsappNumber: document.getElementById("whatsappNumber").value.trim()
    };
    saveLocalMemory(memory);
    return memory;
  }

  function readAccessForm() {
    return {
      memberId: document.getElementById("memberId").value.trim(),
      membershipTier: document.getElementById("membershipTier").value,
      accessCode: document.getElementById("accessCode").value.trim()
    };
  }

  function addMessage(role, content) {
    const node = document.createElement("div");
    node.className = `msg ${role === "user" ? "user" : "bot"}`;
    node.textContent = content;
    chatLog.appendChild(node);
    chatLog.scrollTop = chatLog.scrollHeight;
    return node;
  }

  function addResultMessage(content) {
    const node = addMessage("assistant", content);
    node.classList.add("result");
  }

  function applyRole(role) {
    activeRole = ROLE_COPY[role] ? role : "assistant";
    avatarWrap.dataset.role = activeRole;
    roleBadge.textContent = ROLE_COPY[activeRole].badge;
    roleTitle.textContent = ROLE_COPY[activeRole].title;
    roleCaption.textContent = ROLE_COPY[activeRole].caption;
    avatarImage.src = ROLE_COPY[activeRole].image;
    avatarRoleTag.textContent = ROLE_COPY[activeRole].tag;
    avatarRoleSignal.textContent = activeRole === "assistant" ? "Live" : `${ROLE_COPY[activeRole].badge} Live`;
    roleSelector.querySelectorAll(".role-chip").forEach((button) => {
      button.classList.toggle("active", button.dataset.role === activeRole);
    });
  }

  function applyAccessBadges(state) {
    const label = state.fullAccess ? `${state.membershipTier.toUpperCase()} Access` : "Free Trial";
    accessBadge.textContent = label;
    sessionTierBadge.textContent = label;
    workspaceTierBadge.textContent = label;
    modeBadge.textContent = state.fullAccess ? "Unlocked" : "Trial";
  }

  function updateUsageUi(usage = {}) {
    usageState = {
      ...usageState,
      ...usage
    };

    const limit = Number(usageState.trialDailyChatLimit || 8);
    const used = Number(usageState.trialUsedToday || 0);
    const remaining = Math.max(0, limit - used);
    const width = Math.max(8, Math.min(100, Math.round((used / Math.max(limit, 1)) * 100)));

    trialUsageText.textContent = `${used} / ${limit} used`;
    usageFill.style.width = `${usageState.fullAccess ? 100 : width}%`;
    usageHeadline.textContent = usageState.fullAccess
      ? "Full Genie unlocked"
      : remaining > 0
        ? `Trial active: ${remaining} chats left today`
        : "Trial limit reached for today";
    usageHint.textContent = usageState.fullAccess
      ? "Business workspace, premium planning, and campaign actions are available."
      : "Cloudora admin approval unlocks deeper memory, premium actions, and full workspace tools.";
  }

  function applyWorkspaceState() {
    const unlocked = Boolean(accessState.fullAccess);
    workspaceSection.classList.toggle("is-locked", !unlocked);
    workspaceState.textContent = unlocked ? "Unlocked" : "Locked";
    approvalState.textContent = unlocked
      ? "Approved by Cloudora Admin"
      : "Awaiting Cloudora Admin Approval";
    workspaceHeading.textContent = unlocked ? "Genie business workspace unlocked" : "Unlock full Genie workspace";
    workspaceCopy.textContent = unlocked
      ? "Your business profile, device memory, and premium automation preparation tools are now available."
      : "Business profile, local device channels, campaign memory, aur premium planning tools sirf approved members ke liye khulte hain.";

    quickPrompts.querySelectorAll(".premium-action").forEach((button) => {
      button.classList.toggle("premium-locked", !unlocked);
      button.title = unlocked ? "" : "Full Genie access required";
      button.setAttribute("aria-disabled", unlocked ? "false" : "true");
    });
  }

  function applySessionState(payload = {}) {
    if (payload.membership) {
      saveAccessState({
        memberId: payload.membership.memberId || accessState.memberId || "",
        membershipTier: payload.membership.membershipTier || accessState.membershipTier || "free",
        accessCode: accessState.accessCode || "",
        fullAccess: Boolean(payload.membership.fullAccess),
        trialMode: Boolean(payload.membership.trialMode)
      });
      applyAccessBadges(accessState);
      applyWorkspaceState();
    }

    if (payload.usage) {
      updateUsageUi(payload.usage);
    } else {
      updateUsageUi();
    }

    if (payload.profile) {
      fillProfile(payload.profile);
    }
  }

  async function restoreMemberSession() {
    const token = getMemberToken();
    if (!token) return false;

    const response = await fetch(`${API_BASE}/api/genie/member-session`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const payload = await response.json();
    if (!payload.ok || !payload.active) {
      setMemberToken("");
      return false;
    }

    applySessionState(payload);
    return true;
  }

  async function ensureSession() {
    if (sessionId) return sessionId;

    setStatus("Starting session");
    const response = await fetch(`${API_BASE}/api/genie/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "assistant",
        assistantProfile: accessState.fullAccess ? getProfile() : {},
        memberId: accessState.memberId,
        membershipTier: accessState.membershipTier,
        accessCode: accessState.accessCode,
        memberToken: getMemberToken(),
        clientId: getClientId()
      })
    });

    const payload = await response.json();
    sessionId = payload.sessionId;
    localStorage.setItem(SESSION_KEY, sessionId);
    if (payload.memberToken) setMemberToken(payload.memberToken);
    applySessionState(payload);

    if (payload.welcome) {
      addMessage("assistant", payload.welcome);
      maybeSpeak(payload.welcome);
    }

    setStatus("Ready");
    return sessionId;
  }

  function maybeSpeak(text) {
    if (!voiceEnabled || !window.speak) return;
    setTalking(true);
    setThinking(false);
    window.speak(text);
    setTimeout(() => setTalking(false), Math.min(6500, Math.max(1200, text.length * 45)));
  }

  async function streamAssistantReply(message) {
    const currentSession = await ensureSession();
    const response = await fetch(`${API_BASE}/api/genie/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getMemberToken() ? { Authorization: `Bearer ${getMemberToken()}` } : {})
      },
      body: JSON.stringify({
        sessionId: currentSession,
        message,
        role: activeRole === "assistant" ? "assistant" : "general",
        assistantProfile: accessState.fullAccess ? getProfile() : {},
        memberId: accessState.memberId,
        membershipTier: accessState.membershipTier,
        accessCode: accessState.accessCode,
        memberToken: getMemberToken(),
        clientId: getClientId()
      })
    });

    if (!response.ok || !response.body) {
      throw new Error("Assistant response failed");
    }

    const botNode = addMessage("assistant", "");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalText = "";

    setThinking(true);
    setStatus("Genie is thinking");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      events.forEach((eventChunk) => {
        eventChunk.split("\n").forEach((line) => {
          if (!line.startsWith("data: ")) return;
          const token = line.slice(6);
          if (token === "[DONE]") return;
          finalText += token;
          botNode.textContent = finalText;
          chatLog.scrollTop = chatLog.scrollHeight;
        });
      });
    }

    setThinking(false);
    setTalking(false);
    setStatus("Ready");
    if (finalText && finalText.trim()) {
      if (!accessState.fullAccess) {
        updateUsageUi({
          ...usageState,
          trialUsedToday: Number(usageState.trialUsedToday || 0) + 1
        });
      }
      maybeSpeak(finalText);
      return finalText;
    }

    botNode.remove();
    throw new Error("Empty streamed reply");
  }

  async function fetchAssistantReply(message) {
    const currentSession = await ensureSession();
    const response = await fetch(`${API_BASE}/api/genie/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getMemberToken() ? { Authorization: `Bearer ${getMemberToken()}` } : {})
      },
      body: JSON.stringify({
        sessionId: currentSession,
        message,
        role: activeRole === "assistant" ? "assistant" : "general",
        assistantProfile: accessState.fullAccess ? getProfile() : {},
        memberId: accessState.memberId,
        membershipTier: accessState.membershipTier,
        accessCode: accessState.accessCode,
        memberToken: getMemberToken(),
        clientId: getClientId()
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.reply || !String(payload.reply).trim()) {
      throw new Error(payload.error || payload.reply || "Assistant reply failed");
    }

    if (payload.usage) updateUsageUi(payload.usage);
    addMessage("assistant", payload.reply);
    maybeSpeak(payload.reply);
    setStatus("Ready");
    setThinking(false);
    setTalking(false);
    return payload.reply;
  }

  async function sendMessage(message) {
    if (!message || isStreaming) return;
    isStreaming = true;
    addMessage("user", message);
    messageInput.value = "";

    try {
      await streamAssistantReply(message);
    } catch (error) {
      console.error("Stream reply failed, falling back to non-stream reply:", error);
      try {
        await fetchAssistantReply(message);
      } catch (fallbackError) {
        console.error(fallbackError);
        addMessage(
          "assistant",
          fallbackError.message || "I could not complete that request right now. Please try again."
        );
        setStatus("Error");
        setTalking(false);
        setThinking(false);
      }
    } finally {
      isStreaming = false;
    }
  }

  async function runBlast(dispatch) {
    if (!accessState.fullAccess) {
      throw new Error("Email blast is available only for approved full-access Genie users");
    }

    const profile = getProfile();
    const memory = getLocalMemory();
    setStatus(dispatch ? "Running blast" : "Preparing blast");

    const response = await fetch(
      `${API_BASE}/api/genie/${dispatch ? "run-email-blast" : "prepare-email-blast"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getMemberToken() ? { Authorization: `Bearer ${getMemberToken()}` } : {})
        },
        body: JSON.stringify({
          source: "scraped",
          limit: 10,
          objective: `Generate qualified outreach responses for ${profile.businessName || "this business"}`,
          offer: "Cloudora IT, software, marketing, automation, and growth services",
          tone: profile.tone || "Professional and persuasive",
          cta: "Reply to discuss your business growth needs",
          platformContext: "Email outreach powered by Genie assistant",
          mlblasterUrl: memory.mlblasterUrl || "http://localhost:5000",
          businessProfile: profile,
          dispatch,
          memberId: accessState.memberId,
          accessCode: accessState.accessCode,
          membershipTier: accessState.membershipTier,
          memberToken: getMemberToken(),
          clientId: getClientId()
        })
      }
    );

    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Blast flow failed");
    }

    if (!dispatch) {
      addResultMessage(
        `Blast prepared.\nContacts found: ${payload.contactsFound}\nSubject: ${payload.campaign.subject}\n\nPreview:\n${payload.campaign.previewText || ""}`
      );
      return;
    }

    addResultMessage(
      `Blast run complete.\nContacts found: ${payload.contactsFound}\nSent: ${payload.dispatchResult.sent}\nFailed: ${payload.dispatchResult.failed}\nEndpoint: ${payload.dispatchResult.baseUrl}`
    );
  }

  async function saveProfileToServer(profile) {
    const response = await fetch(`${API_BASE}/api/genie/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getMemberToken() ? { Authorization: `Bearer ${getMemberToken()}` } : {})
      },
      body: JSON.stringify({
        memberToken: getMemberToken(),
        profile
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Could not save profile");
    }

    fillProfile(payload.profile || profile);
  }

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!accessState.fullAccess) {
      addMessage("assistant", "Business workspace unlock karne ke liye pehle approved Genie access chahiye.");
      return;
    }

    const profile = readProfileForm();
    try {
      await saveProfileToServer(profile);
      setStatus("Business profile saved");
      addMessage(
        "assistant",
        `Workspace updated for ${profile.businessName || "your business"}. Genie ab is profile ke hisaab se deeper planning kar sakta hai.`
      );
    } catch (error) {
      addMessage("assistant", error.message);
      setStatus("Profile save failed");
    }
  });

  memoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!accessState.fullAccess) {
      addMessage("assistant", "Local mobile memory premium workspace ka hissa hai. Approval ke baad hi use karo.");
      return;
    }

    readLocalMemoryForm();
    setStatus("Local memory saved on this device");
    addMessage(
      "assistant",
      "Local device memory updated. Genie can now use your saved ML Blaster URL and channel details during campaign workflows on this device."
    );
  });

  accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextState = readAccessForm();
    const endpoint = nextState.memberId ? "member-login" : "verify-access";
    const response = await fetch(`${API_BASE}/api/genie/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...nextState,
        clientId: getClientId()
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setMemberToken("");
      saveAccessState({
        memberId: nextState.memberId,
        membershipTier: "free",
        accessCode: nextState.accessCode,
        fullAccess: false,
        trialMode: true
      });
      applyAccessBadges(accessState);
      applyWorkspaceState();
      addMessage("assistant", payload.error || "Member verification failed.");
      return;
    }

    setMemberToken(payload.memberToken || "");
    saveAccessState({
      memberId: payload.membership.memberId || nextState.memberId,
      membershipTier: payload.membership.membershipTier,
      accessCode: nextState.accessCode,
      fullAccess: payload.membership.fullAccess,
      trialMode: payload.membership.trialMode
    });
    applyAccessBadges(accessState);
    applyWorkspaceState();
    applySessionState(payload);
    setStatus(accessState.fullAccess ? "Full Genie unlocked" : "Running in free trial mode");
    addMessage(
      "assistant",
      accessState.fullAccess
        ? `Full Genie access unlocked for ${accessState.membershipTier} tier. Business workspace ab available hai.`
        : "You are using Genie in free trial mode. Full workspace unlock ke liye Cloudora admin approval chahiye."
    );
  });

  resetProfileBtn.addEventListener("click", () => {
    if (!accessState.fullAccess) return;
    localStorage.removeItem(STORAGE_KEY);
    fillProfile({});
    setStatus("Profile reset");
  });

  resetMemoryBtn.addEventListener("click", () => {
    localStorage.removeItem(MEMORY_KEY);
    fillLocalMemory({});
    setStatus("Local memory cleared");
  });

  newSessionBtn.addEventListener("click", async () => {
    localStorage.removeItem(SESSION_KEY);
    sessionId = "";
    chatLog.innerHTML = "";
    await ensureSession();
  });

  voiceToggleBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    voiceToggleBtn.textContent = voiceEnabled ? "Voice On" : "Voice Off";
  });

  listenBtn.addEventListener("click", () => {
    if (!window.startListening) return;
    setStatus("Listening");
    setTalking(true);
    setThinking(false);
    window.startListening((text) => {
      messageInput.value = text;
      setStatus("Voice captured");
      setTalking(false);
    });
  });

  if (openBlasterBtn) {
    openBlasterBtn.addEventListener("click", openMlBlasterDashboard);
  }

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await sendMessage(messageInput.value.trim());
  });

  quickPrompts.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-prompt]");
    const actionButton = event.target.closest("[data-action]");
    if (button) {
      await sendMessage(button.getAttribute("data-prompt"));
      return;
    }
    if (actionButton) {
      if (actionButton.dataset.action === "openMlBlaster") {
        openMlBlasterDashboard();
        return;
      }
      if (!accessState.fullAccess) {
        addResultMessage(
          "This action is part of Genie full access. Free trial users can test planning and chat, but email blast workflows unlock only after Cloudora admin approval."
        );
        setStatus("Premium action locked");
        return;
      }
      try {
        await runBlast(actionButton.dataset.action === "runBlast");
      } catch (error) {
        addResultMessage(`Campaign action failed: ${error.message}`);
      }
    }
  });

  fillProfile(getProfile());
  fillLocalMemory(getLocalMemory());
  fillAccessState(accessState);
  applyRole("assistant");
  applyWorkspaceState();
  updateUsageUi();

  roleSelector.addEventListener("click", (event) => {
    const button = event.target.closest(".role-chip");
    if (!button) return;
    applyRole(button.dataset.role);
  });

  restoreMemberSession()
    .catch(console.error)
    .finally(() => {
      ensureSession().catch((error) => {
        console.error(error);
        addMessage("assistant", "Genie could not start right now. Please check the backend connection.");
        setStatus("Connection issue");
      });
    });
})();
