# Cloudora Backend And Scope Audit

## 1. Active Product Scope

Active Cloudora platform scope:

- `index.html` + root assets = Cloudora Website
- `backend/` = Cloudora API server
- `cloudora_genie_v.1.0/frontend/` = Cloudora Ops + Genie frontend base
- `services/` = public service pages
- `apply/` = careers/apply flow

Out of active scope:

- `Shoe_museum/`
- `amco/`

These folders should be treated as archived or unrelated unless later reused as portfolio/demo content.

## 2. Mounted Backend Route Surface

Current mounted routers in `backend/index.js`:

- `/api/extract` -> `backend/routes/extractor.js`
- `/api/job` -> `backend/routes/job/job.js`
- `/api/admin` -> `backend/routes/admin.js`
- `/api/tasks` -> `backend/routes/tasks.js`
- `/api/catalogue` -> `backend/routes/admin_upload.js`
- `/api/proposal` -> `backend/routes/api_proposal.js`
- `/api/genie` -> `backend/routes/genie_media.js`
- `/api/genie` -> `backend/routes/genie.js`
- `/api/training` -> `backend/routes/training.js`

Not mounted right now:

- `backend/routes/auth.js`
- `backend/routes/leads_uploads.js`
- `backend/routes/job/login.js`

## 3. Route Classification

### Keep

These belong to the target platform and should remain after refactor:

- `backend/routes/genie.js`
  Core Genie chat, stream, TTS, and session start behavior.

- `backend/routes/genie_media.js`
  Useful for audio upload and conversation persistence.

- `backend/routes/extractor.js`
  Important for telecalling and lead scraping workflows.

- `backend/routes/job/job.js`
  Important because it already contains apply, employee creation, login, and lead timeline concepts.

- `backend/routes/training.js`
  Useful for internal employee training and assessments.

- `backend/routes/admin_upload.js`
  Useful if Cloudora keeps internal catalogue/asset upload flows.

### Refactor

These should remain conceptually, but need structural fixes before they can be treated as stable:

- `backend/routes/admin.js`
  Problem:
  mounted at `/api/admin` but route paths are `/admin/leads` and `/admin/unassigned_tasks`.
  This creates actual paths like `/api/admin/admin/leads`, which is awkward and likely unintended.

- `backend/routes/api_proposal.js`
  Problem:
  mounted at `/api/proposal` but route path is `/proposal/generate`.
  Actual path becomes `/api/proposal/proposal/generate`.
  It also reads from `./backend/genie/kb/kb_products.json`, which does not match the current repo structure.

- `backend/routes/tasks.js`
  Problem:
  this is still in-memory mock logic using `let tasks = []`.
  It cannot support real employee task orchestration in production.

- `backend/routes/extractor.js`
  Problems:
  contains duplicate `/next-lead` route definitions,
  includes top-level debug query logging,
  mixes telecalling and sales assignment logic in one large file,
  needs separation into cleaner workflow modules.

- `backend/routes/job/job.js`
  Problems:
  plaintext password handling,
  random password generation,
  employee login via password column lookup,
  several endpoints are functional but not production-safe.

- `backend/routes/genie.js`
  Problems:
  session IDs use `Math.random`,
  public and internal Genie roles are mixed together,
  no clear auth boundary for internal-only Genie features.

- `backend/index.js`
  Problems:
  CORS is fully open,
  service-role Supabase client is initialized globally,
  route grouping is not separated by public/ops/genie/admin concerns.

### Remove Or Archive

These should not be part of the final active backend surface:

- `backend/routes/job/login.js`
  This file is broken and appears unused.
  It references `emp` in the response even though the query result variable is `data`.

- `backend/routes/auth.js` in current form
  The concept should remain, but this implementation should be replaced rather than adopted.
  Current logic allows login by just phone or email without password or OTP, which is not acceptable for production.

## 4. Major Structural Findings

### A. Prefix duplication

Several routers define route paths with extra prefixes even though the router is already mounted under a matching prefix.

Examples:

- `/api/admin` + `/admin/leads` -> should likely become just `/leads`
- `/api/proposal` + `/proposal/generate` -> should likely become just `/generate`
- `/api/tasks` + `/task/list` -> should likely become just `/list`

### B. Dead or shadow files

- `backend/routes/job/login.js` looks like an older duplicate.
- `backend/routes/auth.js` exists but is not connected.

### C. Production security gaps

- weak authentication
- plaintext password matching
- hardcoded public config in frontend files
- open CORS
- mixed public/internal API boundaries

### D. Business flow is present but not unified

The repo already contains the ingredients for:

- website enquiry capture
- employee login
- telecalling workflows
- sales forwarding
- training flows
- Genie AI chat

But these are not yet stitched together into a single end-to-end Cloudora business system.

## 5. Recommended Route Target Structure

Target route grouping:

```text
/api/public
  /enquiries
  /contact
  /proposal
  /services

/api/ops
  /auth
  /employees
  /tasks
  /leads
  /followups
  /reports

/api/ops/telecalling
  /extract
  /assign
  /call
  /timeline

/api/ops/sales
  /queue
  /status
  /script

/api/genie
  /public
  /employee
  /tts
  /audio
  /conversation
```

## 6. Immediate Refactor Priorities

1. Replace mock tasks system with database-backed tasks.
2. Fix route prefix duplication in `admin`, `proposal`, and `tasks`.
3. Remove or archive `backend/routes/job/login.js`.
4. Replace weak auth with proper employee auth flow.
5. Split `extractor.js` into telecalling and sales workflow modules.
6. Separate public Genie endpoints from internal Genie endpoints.
7. Move all remaining public lead creation into a single website enquiry pipeline.

## 7. Working Decision

From this point onward:

- `Shoe_museum` should not influence root app or route decisions.
- `Cloudora Website` is the public entrypoint.
- `Cloudora Ops` should own employee auth, leads, tasks, and reporting.
- `Cloudora Genie` should be organized as a distinct AI layer with public and internal modes.

