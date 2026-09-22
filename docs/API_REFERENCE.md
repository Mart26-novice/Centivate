# CentIvate API Documentation

This document describes all Express backend API endpoints provided by `/api/app.ts`.

---

## Base URL
- Development / Production: `/api`

---

## Common Headers & Authentication

| Header | Type | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Required for `POST` and `PATCH` requests |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required for administrative mutation endpoints. The token must belong to an account whose Firestore `users/{uid}` doc has `role: "admin"` (or whose email is in the server's admin allowlist) — a signed-in non-admin user is rejected with `403`, not just anyone who is logged in. |
| `x-admin-authorization` | `string` | **Local development only.** Only honored when `NODE_ENV !== 'production'` and must match the server's `ADMIN_DEV_BYPASS_TOKEN` env var. Never set this in production — there is no fallback in production; a missing/invalid Bearer token is simply rejected. |

Requests to mutation endpoints (`PATCH`/`DELETE` on complaints, `POST`/`PATCH`/`DELETE` on staff) fail with `503` if the server has no `FIREBASE_SERVICE_ACCOUNT_KEY` configured — see the main README's environment variable list.

---

### Account Setup — `POST /api/auth/profile`
Completes signup for an account already created client-side via Firebase Auth (`createUserWithEmailAndPassword`). This is the *only* path that writes a `users/{uid}` Firestore document — `firestore.rules` blocks client writes to that collection entirely, specifically to prevent a signed-in user from self-assigning `role: "admin"`.

**Headers:** `Authorization: Bearer <Firebase_ID_Token>` required (the token for the account just created).

**Request Body:**
```json
{
  "accessCode": "the-code-given-to-the-respondent",
  "role": "student",
  "fullName": "Juan Dela Cruz",
  "strandOrDepartment": "STEM 12-A"
}
```
- `role`: one of `student`, `teacher`, `admin`.
- `accessCode`: checked against `SIGNUP_ACCESS_CODE` (student/teacher) or `ADMIN_SIGNUP_CODE` (admin) — a separate, stronger code kept private by the research team.

**Response (200 OK):**
```json
{ "success": true, "role": "student" }
```

**Error responses:** `401` missing/invalid token, `400` invalid role or missing full name, `403` wrong access code, `503` server has no Firebase Admin credentials configured.

---

## Endpoints

### 1. Health Check
`GET /api/health`

**Response (200 OK):**
```json
{
  "status": "ok",
  "appName": "Centivate Complaint System"
}
```

---

### 2. Complaints Management

#### `GET /api/complaints`
Retrieve complaints list with optional filtering.

**Query Parameters:**
- `status`: Filter by status (`Filed`, `Pending`, `In Progress`, `Resolved`, `Cancelled`, `All`)
- `category`: Filter by facility category (`Lighting & Electrical`, `Plumbing & Water`, `Furniture & Fixtures`, `HVAC & Aircon`, `Cleanliness & Sanitation`, `IT & AV Equipment`, `Structural & Safety`, `Other Facilities`)
- `building`: Filter by building (`Main Building`, `Annex Building`, `Science Complex`, `Gymnasium & Sports Center`, `Library & Admin Building`)
- `search`: Case-insensitive text search in title, description, tracking code, or room
- `includeArchived`: `true` to include archived records

**Response (200 OK):** Array of `Complaint` objects.

---

#### `GET /api/complaints/track/:code`
Look up a complaint by tracking code (e.g., `CENT-2026-X7K2M9`).

**Response (200 OK):**
```json
{
  "id": "CMP-1723000000000",
  "trackingCode": "CENT-2026-X7K2M9",
  "title": "Air Conditioner Leaking Water",
  "description": "Water dripping steadily from ceiling cassette AC unit.",
  "category": "HVAC & Aircon",
  "locationBuilding": "Main Building",
  "locationRoom": "Room 302",
  "priority": "High",
  "status": "In Progress",
  "photoUrl": "data:image/jpeg;base64,...",
  "assignedStaff": "Ramon M. Santos",
  "estimatedResolutionDate": "2026-08-10",
  "resolutionNotes": "Replaced condensate drain pipe.",
  "logs": [
    {
      "id": "LOG-1723000000000",
      "status": "Filed",
      "note": "Filed via Student Portal.",
      "updatedBy": "Student Portal",
      "timestamp": "2026-08-07T03:00:00.000Z"
    }
  ],
  "createdAt": "2026-08-07T03:00:00.000Z",
  "updatedAt": "2026-08-07T03:30:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Complaint not found with this tracking code."
}
```

---

#### `POST /api/complaints`
Create a new facility complaint.

**Request Body:**
```json
{
  "title": "Exposed Electric Wiring near Blackboard",
  "description": "Sparking observed on wall outlet in Room 104.",
  "category": "Lighting & Electrical",
  "locationBuilding": "Main Building",
  "locationRoom": "Room 104",
  "priority": "High",
  "photoUrl": "data:image/jpeg;base64,...",
  "studentName": "Maria Santos",
  "studentStrand": "STEM 12-A",
  "isAnonymous": false,
  "contactEmail": "maria.santos@cpu.edu.ph"
}
```

**Validation Rules:**
- `title`: 3–200 characters
- `description`: 10–5000 characters
- `locationBuilding`, `locationRoom`: max 100 characters
- `contactEmail`: valid email address format (if provided)
- `photoUrl`: base64 image (JPEG/PNG/WEBP) < 500KB

**Response (201 Created):** Full `Complaint` object including generated `trackingCode` and initial `aiAnalysis`.

---

#### `PATCH /api/complaints/:id`
Update complaint status, staff assignment, or resolution notes.

**Headers:** Authorization required.

**Request Body:**
```json
{
  "status": "In Progress",
  "priority": "Urgent / Hazard",
  "assignedStaff": "Ramon M. Santos",
  "note": "Assigned electrician to inspect main circuit panel."
}
```

**Response (200 OK):** Updated `Complaint` object.

**Side effect:** if `assignedStaff` changes to a new, non-empty value, the server looks up that staff member's notification email (`staff.email`, set via `POST`/`PATCH /api/staff`) and sends them an assignment email through Resend. This is best-effort — it never blocks or fails the request, and is silently skipped if `RESEND_API_KEY` isn't configured or the staff member has no email on file.

---

#### `DELETE /api/complaints/:id`
Archive a complaint record.

**Headers:** Authorization required.

**Response (200 OK):**
```json
{
  "message": "Complaint archived successfully",
  "id": "CMP-1723000000000"
}
```

---

### 3. Maintenance Staff Management

#### `GET /api/staff`
Retrieve all maintenance staff members with calculated `activeWorkload`.

#### `POST /api/staff`
Add a maintenance staff member.

**Headers:** Authorization required.

**Request Body:**
```json
{
  "name": "Jose Rizal",
  "role": "Senior Electrician",
  "specialty": "Lighting & Electrical",
  "phone": "0917-123-4567",
  "email": "jose.rizal.centivate@gmail.com"
}
```
`email` is optional — when set, this staff member receives a Resend notification email whenever a complaint is assigned to them (see `PATCH /api/complaints/:id`).

#### `PATCH /api/staff/:id`
Update staff profile.

**Headers:** Authorization required.

#### `DELETE /api/staff/:id`
Remove staff profile and unassign open complaints.

**Headers:** Authorization required.

---

### 4. AI & Analytics API

#### `GET /api/stats`
Returns system statistics (complaint counts, building breakdown, average resolution time in hours, satisfaction metrics).

#### `POST /api/ai/analyze-complaint`
Triggers Gemini 3.6 Flash analysis for a complaint.

**Request Body:**
```json
{
  "title": "Sparking Socket",
  "description": "Burnt smell coming from wall outlet.",
  "building": "Main Building",
  "room": "Room 201",
  "category": "Lighting & Electrical"
}
```

**Response (200 OK):**
```json
{
  "suggestedCategory": "Lighting & Electrical",
  "suggestedPriority": "Urgent / Hazard",
  "urgencyReason": "Exposed electrical spark poses immediate shock and fire risk.",
  "recommendedMaintenanceAction": "Disconnect circuit breaker, isolate outlet, replace faulty receptacle.",
  "safetyHazardDetected": true
}
```

---

### 5. System Usability Survey API

#### `GET /api/surveys`
Get all submitted System Usability Scale (SUS) survey responses.

#### `POST /api/surveys`
Submit a new SUS survey evaluation.

**Request Body:**
```json
{
  "role": "Student",
  "susQ1": 5,
  "susQ2": 4,
  "susQ3": 5,
  "susQ4": 4,
  "susQ5": 5,
  "feedbackComments": "Very easy to file complaints and track status!"
}
```
