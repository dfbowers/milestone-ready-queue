(() => {
  const params = new URLSearchParams(window.location.search);
  const apiBaseUrl = window.MILESTONE_QUEUE_CONFIG?.apiBaseUrl?.replace(/\/$/, "") || "";
  const defaultMilestone = window.MILESTONE_QUEUE_CONFIG?.defaultMilestone || "Current Milestone";
  const milestone = (params.get("milestone") || defaultMilestone).trim().slice(0, 80);
  const projectorMode = params.get("projector") === "1";

  const studentView = document.querySelector("#student-view");
  const projectorView = document.querySelector("#projector-view");
  const form = document.querySelector("#ready-form");
  const status = document.querySelector("#form-status");
  const submitButton = document.querySelector("#submit-button");

  document.querySelector("#milestone-message").textContent = `Join the ${milestone} ready queue when you are prepared to complete your assessment.`;
  document.querySelector("#projector-message").textContent = `Scan the code when you are ready for ${milestone}.`;

  if (projectorMode) {
    studentView.hidden = true;
    projectorView.hidden = false;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const studentName = form.studentName.value.trim();
    const workstation = form.workstation.value.trim();

    if (!studentName || !workstation) {
      status.textContent = "Please enter both your name and workstation.";
      return;
    }
    if (!apiBaseUrl) {
      status.textContent = "This queue is not set up yet. Please let your instructor know.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Adding you to the ready queue…";
    try {
      const response = await fetch(`${apiBaseUrl}/api/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, workstation, milestone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to join the queue.");

      form.hidden = true;
      status.classList.add("success");
      status.textContent = "You’re in the ready queue. Continue working quietly on your lab; your instructor will come to you when available.";
    } catch (error) {
      status.textContent = error.message || "Unable to join the queue. Please try again.";
      submitButton.disabled = false;
    }
  });
})();
