# Milestone Ready Queue

A small, reusable readiness queue for CMPS-1000 A+ Software milestones.

Students scan the projector QR code, enter their name and workstation, and receive a confirmation that they are in the ready queue. The instructor opens the private dashboard to call or complete students. The public site never displays student names, queue order, or assessment results.

## Structure

- `docs/` is the GitHub Pages site: student sign-up, projector QR view, and instructor dashboard.
- `worker/` is a Cloudflare Worker with a D1 database. It stores the queue and keeps instructor actions behind an admin passcode.

## Before the first use

1. Deploy the Worker and create its D1 database.
2. Add the Worker URL to `docs/config.js`.
3. Publish `docs/` with GitHub Pages.
4. Open the student page with a milestone label, for example `?milestone=MS2`.
5. Project the same page with `&projector=1` to show its QR code.

The full setup instructions are in `worker/README.md`.

