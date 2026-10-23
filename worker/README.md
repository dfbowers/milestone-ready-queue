# Cloudflare queue service

This Worker stores the shared ready queue in Cloudflare D1. It does not store grades, die rolls, or assessment comments.

## One-time setup

From this `worker` folder:

1. Sign in to Cloudflare with `npx wrangler login`.
2. Create the database with `npx wrangler d1 create milestone-ready-queue`.
3. Copy the returned database ID into `wrangler.toml`.
4. Apply the schema with `npx wrangler d1 execute milestone-ready-queue --remote --file=schema.sql`.
5. Set an instructor-only passcode: `npx wrangler secret put ADMIN_KEY`.
6. Set the GitHub Pages origin: `npx wrangler secret put ALLOWED_ORIGIN` and enter `https://dfbowers.github.io`.
7. Deploy: `npx wrangler deploy`.
8. Copy the Worker URL into `../docs/config.js`, then publish the `docs` directory with GitHub Pages.

## Use

- Student screen: `https://dfbowers.github.io/milestone-ready-queue/?milestone=MS2`
- Projector QR screen: add `&projector=1`
- Instructor queue: `/admin.html?milestone=MS2`

Use a new milestone label each time (for example, `MS3`). The instructor dashboard only shows entries for that label.

