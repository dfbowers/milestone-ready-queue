const allowedStatuses = new Set(["called", "complete", "not-ready"]);

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    Vary: "Origin",
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(env) } });
}

function validText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isAdmin(request, env) {
  const supplied = request.headers.get("X-Admin-Key");
  return supplied && env.ADMIN_KEY && supplied === env.ADMIN_KEY;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(env) });

    if (request.method === "POST" && url.pathname === "/api/ready") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "Please submit the form again." }, 400, env); }
      const { studentName, workstation, milestone } = body;
      if (![studentName, workstation, milestone].every((value) => validText(value, 80))) {
        return json({ error: "Please enter a valid name, workstation, and milestone." }, 400, env);
      }
      await env.DB.prepare("INSERT INTO queue_entries (student_name, workstation, milestone) VALUES (?, ?, ?)")
        .bind(studentName.trim(), workstation.trim(), milestone.trim())
        .run();
      return json({ ok: true }, 201, env);
    }

    if (request.method === "GET" && url.pathname === "/api/queue") {
      if (!isAdmin(request, env)) return json({ error: "Instructor access is required." }, 401, env);
      const milestone = url.searchParams.get("milestone");
      if (!validText(milestone, 80)) return json({ error: "A valid milestone is required." }, 400, env);
      const { results } = await env.DB.prepare(
        "SELECT id, student_name, workstation, milestone, status, submitted_at FROM queue_entries WHERE milestone = ? AND status IN ('waiting', 'called') ORDER BY submitted_at ASC"
      ).bind(milestone.trim()).all();
      return json({ entries: results.map((entry) => ({ id: entry.id, studentName: entry.student_name, workstation: entry.workstation, milestone: entry.milestone, status: entry.status, submittedAt: `${entry.submitted_at}Z` })) }, 200, env);
    }

    const updateMatch = url.pathname.match(/^\/api\/queue\/(\d+)$/);
    if (request.method === "PATCH" && updateMatch) {
      if (!isAdmin(request, env)) return json({ error: "Instructor access is required." }, 401, env);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Please try that action again." }, 400, env); }
      if (!allowedStatuses.has(body.status)) return json({ error: "Invalid queue status." }, 400, env);
      await env.DB.prepare("UPDATE queue_entries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(body.status, Number(updateMatch[1]))
        .run();
      return json({ ok: true }, 200, env);
    }

    return json({ error: "Not found." }, 404, env);
  },
};

