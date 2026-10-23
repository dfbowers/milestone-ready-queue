(() => {
  const params = new URLSearchParams(window.location.search);
  const defaultMilestone = window.MILESTONE_QUEUE_CONFIG?.defaultMilestone || "Current Milestone";
const milestone = (params.get("milestone") || defaultMilestone).trim().slice(0, 80);
  const apiBaseUrl = window.MILESTONE_QUEUE_CONFIG?.apiBaseUrl?.replace(/\/$/, "") || "";
  const form = document.querySelector("#admin-form");
  const passcode = document.querySelector("#admin-key");
  const status = document.querySelector("#admin-status");
  const queueSection = document.querySelector("#queue-section");
  const queueList = document.querySelector("#queue-list");
  const queueCount = document.querySelector("#queue-count");
  let key = "";

  document.querySelector("#dashboard-milestone").textContent = `Showing the ${milestone} ready queue.`;

  async function request(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "X-Admin-Key": key, ...(options.headers || {}) },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load the queue.");
    return result;
  }

  function render(entries) {
    queueList.replaceChildren();
    queueCount.textContent = entries.length ? `${entries.length} student${entries.length === 1 ? "" : "s"} in this queue` : "No students are currently waiting.";
    entries.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "queue-item";
      item.innerHTML = `<div><h2>${escapeHtml(entry.studentName)}</h2><p>Workstation: ${escapeHtml(entry.workstation)} · Joined ${new Date(entry.submittedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div><div class="queue-actions"><button data-status="called">Called</button><button data-status="complete" class="secondary">Complete</button><button data-status="not-ready" class="secondary">Not ready</button></div>`;
      item.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            await request(`/api/queue/${entry.id}`, { method: "PATCH", body: JSON.stringify({ status: button.dataset.status }) });
            await loadQueue();
          } catch (error) {
            status.textContent = error.message;
            button.disabled = false;
          }
        });
      });
      queueList.append(item);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  async function loadQueue() {
    if (!apiBaseUrl) throw new Error("This queue is not set up yet. Add the Worker address to config.js.");
    const result = await request(`/api/queue?milestone=${encodeURIComponent(milestone)}`);
    render(result.entries);
    queueSection.hidden = false;
    status.textContent = "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    key = passcode.value;
    status.textContent = "Opening queue…";
    try {
      await loadQueue();
      passcode.value = "";
      form.hidden = true;
    } catch (error) {
      status.textContent = error.message;
    }
  });

  document.querySelector("#refresh-button").addEventListener("click", () => loadQueue().catch((error) => { status.textContent = error.message; }));
})();

