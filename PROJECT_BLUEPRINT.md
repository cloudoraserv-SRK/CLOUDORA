# Cloudora Platform Blueprint

## 1. Product Definition

Cloudora platform ko 3 connected parts me organize kiya jayega:

1. `Cloudora Website`
   Public-facing marketing and lead generation website for IT and digital services.
   Services include website development, app/software development, digital marketing, branding, automation, AI integrations, and blockchain projects.

2. `Cloudora Ops`
   Internal employee and operations system.
   This handles employee login, lead intake, auto task assignment, telecalling, reporting, management workflows, and delivery-team coordination.

3. `Cloudora Genie`
   AI assistant layer.
   This supports both public users and internal employees through chat, role-based guidance, training, sales assistance, and animated virtual assistant experiences.

`Shoe Museum` is not part of the target product and should be removed from the active app scope.

## 2. What The Final Platform Should Do

### A. Website

- Present Cloudora as a global IT + marketing company.
- Show service pages and business offerings.
- Capture enquiries from potential clients.
- Route each enquiry to the correct department.
- Support multilingual UX where useful.
- Offer Genie as an AI guide for visitors.

### B. Ops / CRM / Workforce System

- Support employee login with proper authentication.
- Manage department-based roles:
  - telecalling
  - field sales
  - management
  - IT / development
  - digital marketing
- Receive website enquiries and convert them into leads/tasks.
- Auto-assign tasks based on service type, geography, department, and workload.
- Allow telecalling teams to:
  - fetch leads
  - scrape new leads
  - call/update CRM
  - log follow-ups and statuses
- Allow managers to:
  - monitor pipelines
  - review team activity
  - reassign work
  - track conversion and productivity
- Allow delivery teams to receive client work items after qualification/closure.

### C. Genie AI

- Public role: service explainer, lead qualifier, support guide.
- Internal role: trainer, sales guide, SOP assistant, employee assistant.
- Role switching by context or department.
- Connect to OpenAI securely through backend only.
- Support animated avatar and voice where needed.

## 3. Current Repo Mapping

### Likely keep and refactor

- `backend/`
  Main API server and business logic base.

- `cloudora_genie_v.1.0/frontend/`
  Existing internal dashboard, job flow, admin, employee and Genie-related UI.

- `services/`
  Service-detail pages that can be reused for the public website.

- `js/`, `css/`, `style.css`, `apply/`, `supabase/`
  Mixed frontend assets and scripts. Some can be reused, but they need cleanup and consolidation.

### Remove from active product scope

- `Shoe_museum/`
  Separate ecommerce project causing routing and asset confusion.

- `amco/`
  Separate demo/client site unless explicitly needed as portfolio content.

### Needs inspection or migration

- Root `index.html`
  Currently appears mixed/confused and must become the actual Cloudora landing page.

- `apply/`
  Can likely be merged into website hiring/careers flow.

## 4. Problems In Current Codebase

### Architecture problems

- Repo mixes multiple products in one root.
- Public site, employee dashboard, and AI system are not clearly separated.
- Some frontend files point to assets/scripts that belong to another project.
- There is no single clear app entrypoint.

### Backend problems

- Authentication is weak or placeholder in parts of the system.
- Some APIs are mock/in-memory only.
- Some routes are duplicated or inconsistent.
- Role and permission design is partial, not systematic.
- Missing route coverage for some frontend flows.

### Security problems

- Sensitive config is hardcoded in frontend files.
- CORS is too permissive.
- Password handling is not production-safe.
- Browser-side code includes server-style config assumptions in some places.

### Product problems

- Enquiry-to-task workflow is not fully defined end-to-end.
- Delivery-team task system is incomplete.
- Genie roles exist conceptually, but the role architecture is not finalized.

## 5. Target Folder Architecture

This repo should move toward the following structure:

```text
/
  website/
    index.html
    services/
    assets/
    js/
    css/

  ops/
    frontend/
      admin/
      employee/
      auth/
      shared/

  genie/
    frontend/
    avatar/
    roles/

  backend/
    index.js
    routes/
      public/
      ops/
      genie/
      admin/
    services/
    lib/
    middleware/
    workflows/
    kb/

  docs/
    architecture/
    api/
    flows/
```

If a full folder move is risky right now, phase 1 can keep the current folders but apply this same separation logically.

## 6. Domain Model To Build Around

### Main business entities

- `leads`
- `enquiries`
- `clients`
- `employees`
- `departments`
- `tasks`
- `task_assignments`
- `followups`
- `projects`
- `project_requirements`
- `genie_conversations`
- `training_modules`
- `performance_logs`

### Department examples

- `telecalling`
- `field_sales`
- `management`
- `it_delivery`
- `digital_marketing`
- `hr`
- `support`

## 7. Required Core Flows

### Flow 1: Website enquiry -> lead -> task

1. Visitor submits enquiry.
2. Backend stores enquiry.
3. Service type is classified.
4. Lead is assigned to telecalling or sales queue.
5. Employee sees the lead in dashboard.
6. Qualification updates are saved.
7. If qualified, project task is created for delivery team.

### Flow 2: Scraped lead -> telecaller action -> escalation

1. Telecalling employee scrapes/imports leads.
2. Lead enters `raw` queue.
3. Auto-assignment or manual assignment happens.
4. Telecaller updates status, notes, next follow-up.
5. Qualified lead moves to sales or management.

### Flow 3: Closed client -> project execution

1. Approved client requirement becomes project record.
2. Project gets task breakdown by department.
3. IT / design / marketing tasks are auto-assigned based on service category.
4. Management tracks project status, blockers, and delivery timelines.

### Flow 4: Genie public assistant

1. Visitor opens Genie on website.
2. Genie explains services and qualifies need.
3. Genie can encourage enquiry submission.
4. Important interactions can create intent logs or lead hints.

### Flow 5: Genie internal assistant

1. Employee opens Genie inside Ops.
2. Genie detects employee role.
3. Genie provides SOP, training, scripts, objection handling, and next-step guidance.

## 8. Build Priorities

### Phase 1: Repo cleanup and boundaries

- Remove `Shoe_museum` from active app scope.
- Decide whether `amco` stays as portfolio/demo content or is archived.
- Make root app clearly Cloudora.
- Separate `website`, `ops`, and `genie` responsibilities.
- Add documentation and environment conventions.

### Phase 2: Security and backend stabilization

- Replace weak login flows with proper auth.
- Move all secrets fully server-side.
- Restrict CORS to allowed origins.
- Remove duplicate or dead routes.
- Replace in-memory task APIs with database-backed flows.

### Phase 3: Public website completion

- Finalize Cloudora landing page.
- Connect service pages to real enquiry forms.
- Create a single contact/proposal/enquiry pipeline.
- Integrate Genie widget cleanly.

### Phase 4: Ops system completion

- Finalize employee roles and permissions.
- Build end-to-end lead, follow-up, reporting, and task assignment flows.
- Add management dashboards and delivery-team task boards.

### Phase 5: Genie completion

- Define Genie role system.
- Unify public and internal conversation APIs.
- Finalize avatar/voice integration through backend-safe APIs.

## 9. Immediate Action Plan

These are the next practical implementation steps:

1. Convert root app into Cloudora website entrypoint.
2. Remove Shoe Museum references and file collisions.
3. Document current backend routes and mark them as:
   - keep
   - refactor
   - remove
4. Define database-backed task model replacing temporary task mocks.
5. Design final enquiry-to-assignment workflow.
6. Lock down authentication and environment handling.

## 10. Working Decision For This Repo

From this point onward, we should treat the project as:

- `Cloudora Website` = public business website
- `Cloudora Ops` = internal CRM/task/employee platform
- `Cloudora Genie` = AI interaction and training layer

And we should treat these as out of scope unless later needed:

- `Shoe_museum`
- any unrelated standalone demo/client site folders

