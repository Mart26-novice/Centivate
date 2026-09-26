# Centivate — Campus Facility Complaint & Maintenance Management System

CentIvate is a full-stack, AI-assisted web application designed for Senior High School (SHS) campus administrators, facility maintenance personnel, and students. It streamlines facility complaint reporting, real-time ticket tracking, automated urgency classification using Google Gemini 3.6 Flash AI, maintenance workload assignment, and system usability evaluation.

---

## 🌟 Key Features

1. **Real Self-Service Authentication**
   - Firebase Auth signup/login for three roles — **student**, **teacher**, **admin** — no institutional email domain required, so pilot respondents can join with any personal email.
   - Signup is gated by an access code: a `SIGNUP_ACCESS_CODE` handed to student/teacher respondents, and a separate, stronger `ADMIN_SIGNUP_CODE` kept private by the research team.
   - Role is written server-side only (`POST /api/auth/profile`, via the Firebase Admin SDK) — `firestore.rules` blocks client writes to `users/{uid}` entirely, so a signed-in user can never self-assign `role: "admin"`.

2. **Student Complaint Filing Portal**
   - Public submission form with client & server validation (Title, Description, Category, Building, Room, Photo Uploads).
   - Anonymous reporting option or full student identification (Strand, Contact Email).
   - Image upload payload size & MIME-type restriction (compression to <500KB JPEG/PNG/WEBP).

3. **Real-time Complaint Tracker**
   - High-entropy tracking code generation (`CENT-2026-XXXXXX`) preventing code collisions and brute-force guessing.
   - Public single-document lookup via `/api/complaints/track/:code` endpoint.
   - Full status history and audit log visualization.

4. **Admin & Maintenance Management Dashboard**
   - Filter, search, assign, resolve, or archive facility complaints.
   - Role-gated maintenance staff workload management, including a per-staff notification email.
   - Live AI Analysis trigger for automated priority elevation upon safety hazard detection.
   - Section switcher for Work Orders, Technicians, and the Student Directory: a collapsible side rail on tablet/desktop (starts as a slim icon rail below 1536px wide, remembers your choice) and a visible tab bar with counts on phones.
   - Readable work-order table (tracking codes never wrap, titles wrap to two lines) and filters covering every facility category and building.

5. **Staff Assignment Email Notifications (Resend)**
   - When an admin assigns a complaint to a maintenance staff member, the server emails that staff member automatically via [Resend](https://resend.com) — best-effort, and silently skipped if `RESEND_API_KEY` isn't configured.

6. **AI-Assisted Complaint Diagnosis (Gemini 3.6 Flash)**
   - Automatically analyzes complaint titles and descriptions.
   - Recommends appropriate maintenance actions and evaluates safety hazard risks (electrical, water leak, structural).
   - Auto-elevates ticket priority to 'High' or 'Urgent / Hazard' when safety hazards are flagged.

7. **System Usability Scale (SUS) Survey**
   - Embedded survey collection for research data gathering and campus satisfaction metrics.

8. **App-wide Collapsible Sidebar Navigation**
   - The whole app (Home, Student Portal, Admin Dashboard, Analytics & Research) is navigated through a single left sidebar — persistent and collapsible from 1024px up, a slide-in drawer below that (phones and tablets) — instead of a header nav bar, keeping the header itself limited to branding, tracking search, and login/logout.

9. **Accessibility & Responsive Polish**
   - Every form field has an associated label; icon-only buttons have accessible names; facility categories are keyboard-operable radio buttons with visible focus; all dialogs close with `Esc` (`src/lib/useEscapeKey.ts`).
   - Landing hero image fills the section without stretching: a plain cover fit on tablet/desktop (section is at least half as tall as it is wide, so cropping comes off the sky, not the sign and lawn) and a full-photo layout on phones.
   - Tested at 1440, 1024, 820 and 390 px wide (Playwright CLI + browser pane) with no horizontal overflow.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React |
| **Backend API** | Node.js, Express, TypeScript |
| **AI Integration** | `@google/genai` SDK with `gemini-3.6-flash` |
| **Database & Auth** | Firebase Firestore, Firebase Auth, `firebase-admin` SDK |
| **Email** | [Resend](https://resend.com) — staff assignment notifications |
| **Security** | Firestore Security Rules (`firestore.rules`), Firebase ID Token + role verification middleware |
| **Testing** | Vitest (`npm test`): 49 tests covering the Express API (privacy scoping, validation, audit logging, rate limiting, staff email), helpers and email escaping; TypeScript type checking (`npm run lint` = `tsc --noEmit`) |
| **Deployment** | Vercel (serverless Node functions) |

---

## 🏗️ System Architecture & Security Model

```
+-----------------------------------------------------------------------+
|                             CLIENT LAYER                              |
|   Student Portal       Public Tracker      Admin Dashboard       SUS  |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
+-----------------------------------+               +-------------------+
|            EXPRESS API            |               | FIREBASE CLIENT   |
|         (Server Backend)          |               |    (Firestore)    |
| - Server-side validation          |               | - Read/Write docs |
| - Bearer Token & AdminAuth        |               | - Security Rules  |
| - Gemini 3.6 Flash AI Diagnosis   |               |   Gating          |
+-----------------------------------+               +-------------------+
         |                                                   |
         +-------------------------+-------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          DATABASE & SERVICES                          |
|    Firestore Collections: complaints, staff, surveys, students        |
|    Google Gemini 3.6 Flash API                                        |
+-----------------------------------------------------------------------+
```

### Security Measures Implemented
- **Firestore Security Rules**: The client SDK is read-only and admin-only for `complaints`, `staff`, `surveys` and `students`; a user may read only their own `users/{uid}` profile. Complaints, surveys and staff are written exclusively by the Express API (Admin SDK) after validation. Public tracking and students' own reports go through the API, never direct Firestore reads. The `users` collection (where role assignment lives) is entirely client-write-blocked (`allow write: if false`).
- **Verified-email admin allowlist**: the built-in admin email allowlist (in `api/app.ts` and `firestore.rules`) is honoured only when the Firebase account's email is **verified**, because Firebase lets anyone register any address. The reliable way to be admin is the `role: "admin"` field in `users/{uid}`, which only the signup endpoint can write.
- **Server API Authorization**: Mutating API endpoints (`PATCH`, `DELETE` for complaints; `POST`, `PATCH`, `DELETE` for staff) verify a Firebase ID Token *and* that the token belongs to an admin (`role: "admin"` in `users/{uid}`, or a verified allowlisted email) — a valid token from a non-admin account is rejected with `403`. Audit-log entries are attributed to the verified admin's email, never to a client-supplied name.
- **Privacy scoping**: `GET /api/complaints` returns full records only to admins and to the account that filed a report (anonymous reports are never linked to an account and store no contact details); everyone else receives an aggregate-only view (status, category, building, priority, dates). `GET /api/staff` hides phone/email from non-admins and `GET /api/surveys` is admin-only.
- **Abuse protection**: per-IP rate limits on complaint filing, tracking lookups, surveys, AI analysis and failed access-code attempts (in-memory per server instance — a first line of defence, not a substitute for a WAF), constant-time access-code comparison, hardening headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`), and HTML-escaping of complaint text in assignment emails.
- **Honest failures**: when Firebase credentials are configured, a failed Firestore write returns an error to the user instead of a fake success; demo seed data is used only for local development or when `SEED_DEMO_DATA=true`, and statistics show "No data yet" rather than invented numbers.
- **Role assignment is server-only**: the only way a `users/{uid}` document gets written is `POST /api/auth/profile`, which requires a verified ID token *and* the correct access code for the requested role (a separate, stronger code for `admin`). This prevents a signed-in user from ever self-assigning admin privileges via the client SDK.
- **Local-dev-only auth bypass**: `x-admin-authorization` is honored only when `NODE_ENV !== 'production'` and matches `ADMIN_DEV_BYPASS_TOKEN` — never set that variable in a production environment.
- **Input & File Payload Validation**: Server-side string length caps (e.g., Description 10–5000 chars) and base64 image MIME type check (`data:image/jpeg`, `data:image/png`, `data:image/webp`, `<500KB`).

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Firebase Project with Firestore enabled

### Installation Steps

1. **Clone Repository & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables Configuration:**
   Copy `.env.example` to `.env` and fill in your environment configuration:
   ```bash
   cp .env.example .env
   ```
   Key variables:
   - `GEMINI_API_KEY`: API key for Google Gemini model inference. Optional — AI diagnosis gracefully falls back to keyword-based heuristics if unset.
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: **Required for any server-side Firestore/Auth call to work** (signup, login profile lookup, admin writes). The full JSON contents of a Firebase Console → Project Settings → Service Accounts → *Generate new private key* download, as **one env var value** — not a file path. Without it, the app still runs and GET routes fall back to in-memory seed data, but signup/login and all writes are disabled (mutation endpoints return `503`).
     > **Vercel-specific gotcha we hit in practice**: pasting multi-line JSON into Vercel's dashboard "Value" field is prone to silent corruption (stray quotes, a BOM character, etc.) that only surfaces as a cryptic `verifyIdToken` JSON parse error at runtime. Prefer setting it via the CLI with file redirection instead of a pipe or the web UI textarea: `vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production < path\to\key.json` (Windows: use `cmd /c "vercel env add ... < path\to\key.json"` — PowerShell's pipe operator injects a UTF-8 BOM that also breaks this).
   - `SIGNUP_ACCESS_CODE` / `ADMIN_SIGNUP_CODE`: gate self-service signup for student/teacher and admin respectively — see `.env.example` for details. Required for `POST /api/auth/profile` to ever succeed.
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL`: optional — enables the staff assignment email notification. Free tier at [resend.com](https://resend.com); `RESEND_FROM_EMAIL` can be left as the default sandbox address (`onboarding@resend.dev`), no domain verification needed.
   - `ADMIN_DEV_BYPASS_TOKEN`: local development only, never set in production — see `.env.example`.

   See `.env.example` for the full list with detailed comments.

3. **Firebase Project Setup:**
   This repo's client config (`src/lib/firebaseProjectConfig.ts`) and `.firebaserc` point at a specific Firebase project — swap both if you're standing up your own. Note: an AI-Studio-provisioned Firebase project may have an **organization policy that blocks service account key creation entirely** (`constraints/iam.disableServiceAccountKeyCreation`, non-negotiable regardless of billing plan or IAM role) — if `gcloud iam service-accounts keys create` fails with `FAILED_PRECONDITION`, you'll need a normal, self-created Firebase project instead (Firebase Console → Add project), which has no such restriction.

   Deploy `firestore.rules` to your Firebase project:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (Requires `firebase login` once; the target project comes from `.firebaserc`, or pass `--project <id>` explicitly.)

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The dev server starts on `http://localhost:3000`.

5. **Run Unit & Helper Tests:**
   ```bash
   npm run test
   ```

---

## 📡 REST API Reference

> Full details, request/response shapes, and error cases: [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md).

### 0. Authentication

#### `POST /api/auth/profile`
Completes signup for a Firebase Auth account created client-side, by writing its `users/{uid}` Firestore profile (role + name) — the *only* path that document can be written through, since `firestore.rules` blocks client writes to it entirely.
- **Access**: Requires `Authorization: Bearer <Firebase_ID_Token>` for the just-created account, plus the correct access code (`SIGNUP_ACCESS_CODE` for student/teacher, `ADMIN_SIGNUP_CODE` for admin) in the request body.

---

### 1. Complaints API

#### `GET /api/complaints`
Retrieve list of complaints with optional filtering.
- **Access**: Scoped by caller — admins get full records; a signed-in user gets their own (non-anonymous) reports in full plus an aggregate-only view of the rest; anonymous visitors get the aggregate-only view (no titles, descriptions, tracking codes, names, emails or photos).
- **Query Parameters**:
  - `status` (`Filed`, `In Progress`, `Resolved`, `Cancelled`, `All`)
  - `category` (`Lighting & Electrical`, `Plumbing & Water`, etc.)
  - `building` (`Main Building`, `Annex Building`, etc.)
  - `search` (text search in title, tracking code, description)
  - `includeArchived` (`true` / `false`)

#### `GET /api/complaints/track/:code`
Lookup public complaint status by tracking code.
- **Access**: Public
- **Response Shape**:
  ```json
  {
    "id": "CMP-1723000000000",
    "trackingCode": "CENT-2026-X7K2M9",
    "title": "Broken Air Conditioner",
    "status": "In Progress",
    "priority": "High",
    "locationBuilding": "Main Building",
    "locationRoom": "Room 302",
    "logs": [...]
  }
  ```

#### `POST /api/complaints`
File a new complaint.
- **Access**: Public
- **Body Payload**:
  ```json
  {
    "title": "Water Leak near Ceiling",
    "description": "Continuous dripping from roof fixture in Room 201.",
    "category": "Plumbing & Water",
    "locationBuilding": "Main Building",
    "locationRoom": "Room 201",
    "priority": "High",
    "studentName": "John Doe",
    "contactEmail": "john.doe@cpu.edu.ph",
    "isAnonymous": false,
    "photoUrl": "data:image/jpeg;base64,..."
  }
  ```

#### `PATCH /api/complaints/:id`
Update complaint status, assign staff, or record resolution notes.
- **Access**: Admin only (`Authorization: Bearer <token>` for an account with `role: "admin"`).
- Assigning a new `assignedStaff` value triggers a best-effort Resend email to that staff member, if they have a notification email on file.

#### `DELETE /api/complaints/:id`
Archive a complaint.
- **Access**: Admin only (`Authorization: Bearer <token>` for an account with `role: "admin"`).

---

### 2. Maintenance Staff API

#### `GET /api/staff`
Get all maintenance personnel and current workload metrics. Admins receive phone and email; everyone else receives only name, role, specialty and workload.

#### `POST /api/staff`
Add a new maintenance staff member.
- **Access**: Admin required.

#### `PATCH /api/staff/:id`
Update staff member details.
- **Access**: Admin required.

#### `DELETE /api/staff/:id`
Remove staff member and reassign open complaints.
- **Access**: Admin required.

---

### 3. Analytics & AI API

#### `GET /api/stats`
Compute real-time campus maintenance metrics (resolution times, category breakdown, satisfaction score).

#### `POST /api/ai/analyze-complaint`
On-demand Gemini 3.6 Flash diagnosis of a facility complaint.

---

## 📁 File & Directory Structure

```
.
├── api/                             # Server Express API handlers (Vercel serverless entry)
│   ├── lib/
│   │   └── email.ts                 # Resend staff-assignment email helper
│   ├── app.ts                       # Express REST endpoints & middleware
│   └── index.ts                     # Vercel Node function entry point (exports the Express app directly)
├── docs/                            # Documentation
│   └── API_REFERENCE.md             # REST API reference guide
├── public/                          # Static public assets
│   └── cpu_campus_aerial.jpg        # Campus aerial photo
├── src/                             # Client React Application source
│   ├── __tests__/                   # Automated unit & integration tests
│   │   ├── authAndApi.test.ts       # API behaviour: privacy scoping, validation, audit log, staff email, admin gating
│   │   ├── apiRateLimit.test.ts     # Rate limiting
│   │   ├── complaintHelpers.test.ts
│   │   ├── emailTemplate.test.ts    # HTML escaping in assignment emails
│   │   └── initialData.test.ts
│   ├── components/                  # UI React components & modals
│   │   ├── AdminDashboard.tsx       # Admin dashboard, with its own collapsible internal sidebar
│   │   ├── AnalyticsView.tsx        # System analytics & SUS survey charts
│   │   ├── AppSidebar.tsx           # App-wide collapsible left nav (Home/Student/Admin/Analytics)
│   │   ├── ComplaintDetailsModal.tsx# Detailed ticket view & audit logs modal
│   │   ├── Header.tsx               # Branding, tracking search, login/logout (nav lives in AppSidebar)
│   │   ├── IntroOverlay.tsx         # Session intro/loading screen overlay
│   │   ├── LandingPage.tsx          # Public campus overview & quick action hub
│   │   ├── LoginModal.tsx           # Real Firebase Auth login / role-gated signup modal
│   │   ├── PhotoUploadModal.tsx     # Compressed photo attachment handler
│   │   ├── PrintableReportModal.tsx # Printable PDF/print report layout
│   │   ├── PublicTracker.tsx        # Single-complaint tracking lookup view
│   │   ├── ResearchInfoModal.tsx    # Academic research background & SUS survey modal
│   │   └── StudentPortal.tsx        # Complaint filing form (accessible category radios) & history portal
│   ├── data/                        # Static seed & preset data
│   │   ├── authData.ts              # Legacy demo preset data; no longer imported by the app (safe to delete)
│   │   └── initialData.ts           # Demo campus complaints, staff & survey seeds
│   ├── db/                          # Unused Postgres/Drizzle schema (not wired into the app; kept for reference)
│   │   ├── drizzle.config.ts
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── lib/                         # Integration clients & SDKs
│   │   ├── firebase-admin.ts        # Server-side Firebase Admin SDK — lazy init, explicit credentials
│   │   ├── firebase.ts              # Client-side Firebase App SDK initialization
│   │   ├── firebaseProjectConfig.ts # Public Firebase web config (plain TS module, not a JSON import)
│   │   ├── firestoreService.ts      # API client (apiFetch), session restore, complaint/staff polling, admin realtime + student directory
│   │   └── useEscapeKey.ts          # Esc-to-close hook used by all dialogs
│   ├── utils/                       # Helper & utility functions
│   │   └── complaintHelpers.ts      # Tracking code generator, search & stats computers
│   ├── App.tsx                      # Root application component, global state, app-shell layout
│   ├── index.css                    # Tailwind CSS imports & global styles
│   ├── main.tsx                     # React DOM entry point
│   └── types.ts                     # TypeScript interfaces, types & enums
├── .claude/launch.json              # Dev server config for local preview tooling
├── .env.example / env.example       # Environment variables template
├── .firebaserc                      # Default Firebase CLI project target
├── firebase.json                    # Firebase CLI config (points at firestore.rules)
├── firebase-applet-config.json      # Original AI-Studio-issued Firebase config (superseded by firebaseProjectConfig.ts for the app itself; kept for reference)
├── firebase-blueprint.json          # Firestore collection blueprint schema
├── firestore.rules                  # Firestore security rules
├── metadata.json                    # Application metadata & permissions
├── package.json                     # Dependencies & build scripts
├── server.ts                        # Local/non-Vercel server entry point (Express + Vite)
├── tsconfig.json                    # TypeScript compiler options
└── vite.config.ts                   # Vite bundler configuration
```

---

## 📁 Project Configuration Files

- `metadata.json`: Contains application name, description, frame permissions, and server capabilities.
- `src/lib/firebaseProjectConfig.ts`: **The actual, live** Firebase web config the app uses (client and server both import it). A plain TS module rather than a JSON import deliberately — a static JSON import only reliably resolves where a bundler inlines it, which Vercel's per-file Node function builder for `api/*.ts` does not do.
- `firebase-applet-config.json`: The original AI-Studio-issued config. No longer read by the app itself; kept for reference / in case you're diffing against the original AI Studio export.
- `firestore.rules`: Security rules enforcing authorization boundaries on Firestore collections. Deploy changes with `firebase deploy --only firestore:rules` — editing this file alone does **not** update what's live.
- `firebase.json` / `.firebaserc`: Firebase CLI config — what `firebase deploy` actually deploys (`firestore.rules`) and which project it targets by default.
- `firebase-blueprint.json`: Initial blueprint schema definition for provisioned collections.

---

## 🎓 Research Presentation & Defense Limitations

When presenting CentIvate for academic defense or technical evaluation, note these intentional architectural scope decisions:

1. **Inline Photo Attachments**: Photos are currently stored as compressed base64 strings in Firestore documents (<500KB). Production recommendation is migrating to Google Cloud Storage / Firebase Storage buckets for high-resolution attachments.
2. **Open Self-Service Signup, Not Institutional SSO**: Authentication is real Firebase Auth, gated by a shared access code rather than restricted to `@cpu.edu.ph` accounts — a deliberate pilot-scope decision so respondents can participate with any personal email, without needing institutional domain access. Production enterprise rollout should replace the access-code gate with SSO/SAML restricted to institutional accounts.
3. **Multi-tenant Expansion**: Built for single-institution campus deployment (Central Philippine University SHS). Multi-campus support requires tenant partitioning in Firestore schemas.
4. **Staff Notification Emails Are Best-Effort**: Resend delivery isn't guaranteed or retried — for a production deployment beyond a research pilot, pair it with an in-app notification or a delivery-status check.
