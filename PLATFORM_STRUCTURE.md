# Cloudora Structure Separation

## Clear Product Separation

Cloudora should now be understood in 3 separate areas:

1. `Cloudora Presentation`
   Purpose:
   - introduce the company
   - explain IT + marketing services
   - show company profile / presentation
   - convert visitors into client enquiries

   Main paths:
   - `index.html`
   - `services/`
   - `assets/Cloudora_Profile.pdf`

2. `Employment / Ops`
   Purpose:
   - work-from-home jobs
   - employee login
   - lead assignment
   - telecalling, sales, management, delivery workflows

   Main paths:
   - `apply/`
   - `cloudora_genie_v.1.0/frontend/employee/`
   - `backend/routes/tasks.js`
   - `backend/routes/job/job.js`
   - `backend/routes/extractor.js`

3. `Genie AI`
   Purpose:
   - public AI guide
   - employee AI trainer
   - role-based internal assistant
   - avatar / voice / AI interaction layer

   Main paths:
   - `cloudora_genie_v.1.0/frontend/index.html`
   - `cloudora_genie_v.1.0/frontend/genie/`
   - `backend/routes/genie.js`
   - `backend/routes/genie_media.js`
   - `backend/kb/`

## Working Rearrangement Decision

Until a full folder move is done, we should treat the repo like this:

- Presentation = root website
- Employment/Ops = employee + apply + backend task/lead/auth routes
- Genie AI = genie frontend + genie backend routes + KB

## Suggested Future Folder Targets

```text
/presentation
  /site
  /services
  /profile

/employment
  /apply
  /employee-frontend
  /ops-backend

/genie
  /frontend
  /backend
  /kb
```

## Immediate Rule

Whenever we add a feature, it should first be assigned to one of these 3 areas:

- `Presentation`
- `Employment/Ops`
- `Genie AI`

This prevents the repo from mixing unrelated pages and workflows again.
