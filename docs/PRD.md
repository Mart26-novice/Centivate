# Centivate — Product Requirements Document

| | |
|---|---|
| Product | Centivate: SHS Facility Maintenance & Reporting Portal |
| Context | Senior High School capstone research project, Central Philippine University (CPU) |
| Version | 3.0 (matches `package.json`) |
| Status | Pilot / research deployment |
| Related docs | [`Architecture.md`](Architecture.md) · [`Design-System.md`](Design-System.md) · [`API_REFERENCE.md`](API_REFERENCE.md) |

## 1. Problem

Facility complaints in the SHS are reported on paper or by word of mouth. Reports get lost, repairs are slow, and students cannot see whether anyone is working on the problem. Administrators have no single list of open issues, no way to see which buildings or categories cause the most trouble, and no record of who did what.

## 2. Goal

Replace paper reporting with a web app that:

1. Lets a student report a facility problem in about a minute, from a phone, with a photo.
2. Gives every report a tracking code so anyone can check its status without logging in.
3. Gives administrators one dashboard to prioritize, assign, resolve and archive work orders.
4. Flags safety hazards early (AI-assisted, optional).
5. Produces usability data (a SUS-style survey) for the research study.

### Non-goals

- Migrating to institutional SSO, multi-campus tenancy, or native mobile apps (see section 9).
- Inventory, purchasing, or scheduling preventive maintenance.
- Maintenance staff logging in. Staff are records that receive email notifications; admins update tickets on their behalf.

## 3. Users

| User | Account | Main needs |
|---|---|---|
| **Student** | Yes (access code), or report anonymously | File a report quickly; attach a photo; stay anonymous if they want; see their own reports; track status |
| **Teacher** | Yes (same access code as students) | Same as students, typically for their classroom |
| **Administrator** (facilities office / research team) | Yes (separate admin code) | See and filter all reports; set priority and status; assign staff; write resolution notes; archive; manage staff and the student directory; view analytics and survey results |
| **Maintenance staff** | No | Get told when a job is assigned to them (email) |
| **Public visitor** | No | Look up a report by tracking code; see aggregate campus statistics |

## 4. User stories

**Students and teachers**
- As a student, I can file a complaint with title, description, category, building, room and an optional photo, so the facilities office knows exactly what and where.
- As a student, I can file anonymously, so I can report without fear of being identified.
- As a student, I receive a tracking code after filing, so I can check progress later.
- As a signed-in student, I can see all my own non-anonymous reports and their status in one place.

**Anyone**
- As anyone with a tracking code, I can see the current status, priority, assigned staff and full status history of that report.
- As anyone, I can see campus-level statistics (counts by status, category and building) without seeing personal details.

**Administrators**
- As an admin, I can filter and search all reports by status, category, building and text.
- As an admin, I can change status and priority, assign a staff member, set an estimated resolution date and write resolution notes, and every change is recorded in an audit log with my identity.
- As an admin, assigning a staff member emails them automatically.
- As an admin, I can request an AI analysis that suggests category, priority and a maintenance action and flags safety hazards.
- As an admin, I can add, edit and remove maintenance staff and see each person's active workload.
- As an admin, I can manage the official student directory.
- As an admin, I can print a report and view analytics and survey results.

**Research**
- As a respondent, I can complete a short usability survey inside the app.
- As the research team, I can see all survey responses and the average satisfaction score.

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Email/password sign-up gated by an access code; separate admin code; role set server-side only | Must |
| FR-2 | Complaint form with the 9 categories and 7 buildings defined in `src/types.ts`; title 3–200 chars, description 10–5000 chars | Must |
| FR-3 | Optional photo, compressed on the client, JPEG/PNG/WEBP under 500 KB | Must |
| FR-4 | Anonymous reporting that stores no owner or contact details | Must |
| FR-5 | Unique tracking code `CENT-2026-XXXXXX` per report | Must |
| FR-6 | Public tracking page with status timeline | Must |
| FR-7 | "My reports" list for signed-in users | Must |
| FR-8 | Admin dashboard: filter, search, status/priority changes, assignment, resolution notes, archive | Must |
| FR-9 | Audit log entry for every admin change, attributed to the verified admin | Must |
| FR-10 | Staff management with workload counts | Must |
| FR-11 | Assignment email to staff (best-effort, skipped when not configured) | Should |
| FR-12 | AI analysis suggesting category, priority, action and hazard flag; a hazard raises Low/Medium priority to High | Should |
| FR-13 | Analytics: counts by status, category and building; average resolution time; urgent count | Should |
| FR-14 | In-app usability survey (5 items, 1–5 scale) and results view | Must (research) |
| FR-15 | Printable report | Could |
| FR-16 | Student directory management | Could |

Statuses: `Filed`, `Pending`, `In Progress`, `Resolved`, `Cancelled`. Priorities: `Low`, `Medium`, `High`, `Urgent / Hazard`.

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Privacy | Non-admins never receive names, emails, descriptions, photos or tracking codes of other people's reports. Staff phone and email are admin-only. Survey comments are admin-only. |
| Security | Clients cannot write complaints, staff, surveys or user roles directly. Admin actions require a verified admin token. Signup, filing, tracking, AI and survey endpoints are rate limited. No secrets in the repository. |
| Accessibility | Labelled form fields, keyboard-operable controls, visible focus, `Esc` closes dialogs, text contrast meeting WCAG AA, touch targets of at least 44 px. |
| Responsiveness | Usable with no horizontal scroll at 390, 820, 1024 and 1440 px. |
| Performance | Fast first load on campus Wi-Fi (system fonts, small bundle); status changes visible to students within about 30 seconds. |
| Reliability | Failed saves are reported to the user, never shown as success. No invented statistics. |
| Maintainability | TypeScript throughout; `npm run lint` and `npm test` pass on every change. |

## 7. Success measures

These are for the research evaluation. The team should confirm the exact targets.

| Measure | How it's measured | Suggested target |
|---|---|---|
| Usability | Average of the 5 in-app survey items (1–5) | 4.0 or higher |
| Time to file | Observed during testing | Under 2 minutes on a phone |
| Tracking success | Respondents find their report by code without help | 90% or more |
| Resolution time | `avgResolutionTimeHours` from `/api/stats` during the pilot | Baseline vs. paper process |
| Coverage | Share of reports with category, building and room filled | 100% (enforced by the form) |

The survey uses 5 custom items, not the standard 10-item System Usability Scale, so results should not be compared directly with the published SUS benchmark of 68.

## 8. Assumptions and constraints

- Single campus (CPU SHS) with a fixed list of buildings and categories.
- Firebase (Auth + Firestore) on a free or low-cost plan; hosted on Vercel.
- Photos are stored inline in Firestore, which caps them at 500 KB.
- Gemini and Resend are optional; the app must work without them.
- Pilot respondents may use personal email addresses, hence the access-code gate instead of domain restriction.

## 9. Out of scope and future work

| Item | Why deferred |
|---|---|
| Institutional SSO restricted to `@cpu.edu.ph` | Pilot respondents need personal emails |
| Firebase Storage for full-resolution photos | Inline base64 is enough for the pilot |
| Maintenance staff accounts and mobile updates | Admins relay updates during the pilot |
| In-app and push notifications | Email covers staff assignment |
| Multi-campus / tenant support | Single-institution study |
| Shared rate limiting / WAF | In-memory limits suffice at pilot scale |

## 10. Open questions

- Should students be notified when their report changes status (email or in-app)?
- Who creates admin accounts after the research team hands the system over?
- How long should resolved and archived reports be kept, and who may export them?
- Should `Pending` stay as a separate status from `Filed`, or be merged?
