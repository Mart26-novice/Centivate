# CentIvate — Campus Facility Complaint & Maintenance Management System

CentIvate is a full-stack, AI-assisted web application designed for Senior High School (SHS) campus administrators, facility maintenance personnel, and students. It streamlines facility complaint reporting, real-time ticket tracking, automated urgency classification using Google Gemini 3.6 Flash AI, maintenance workload assignment, and system usability evaluation.

---

## 🌟 Key Features

1. **Student Complaint Filing Portal**
   - Public submission form with client & server validation (Title, Description, Category, Building, Room, Photo Uploads).
   - Anonymous reporting option or full student identification (Strand, Contact Email).
   - Image upload payload size & MIME-type restriction (compression to <500KB JPEG/PNG/WEBP).

2. **Real-time Complaint Tracker**
   - High-entropy tracking code generation (`CENT-2026-XXXXXX`) preventing code collisions and brute-force guessing.
   - Public single-document lookup via `/api/complaints/track/:code` endpoint.
   - Full status history and audit log visualization.

3. **Admin & Maintenance Management Dashboard**
   - Filter, search, assign, resolve, or archive facility complaints.
   - Role-gated maintenance staff workload management.
   - Live AI Analysis trigger for automated priority elevation upon safety hazard detection.

4. **AI-Assisted Complaint Diagnosis (Gemini 3.6 Flash)**
   - Automatically analyzes complaint titles and descriptions.
   - Recommends appropriate maintenance actions and evaluates safety hazard risks (electrical, water leak, structural).
   - Auto-elevates ticket priority to 'High' or 'Urgent / Hazard' when safety hazards are flagged.

5. **System Usability Scale (SUS) Survey**
   - Embedded survey collection for research data gathering and campus satisfaction metrics.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion |
| **Backend API** | Node.js, Express, TypeScript |
| **AI Integration** | `@google/genai` SDK with `gemini-3.6-flash` |
| **Database & Auth** | Firebase Firestore, Firebase Auth, `firebase-admin` SDK |
| **Security** | Firestore Security Rules (`firestore.rules`), Token Verification Middleware |
| **Testing** | Vitest (`vitest run`), TypeScript Type Checking (`tsc --noEmit`) |

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
- **Firestore Security Rules**: Single-document read (`get`) is permitted for public tracking lookups; bulk list operations (`list`) and sensitive collections (`staff`, `students`, `surveys`) require authenticated credentials (`isEmailAuth()`). Mutation/Deletion is restricted to administrative roles (`isAdmin()`).
- **Server API Authorization**: Mutating API endpoints (`PATCH`, `DELETE` for complaints; `POST`, `PATCH`, `DELETE` for staff) verify Firebase ID Tokens (`firebase-admin`) or authenticated admin session tokens.
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
   - `GEMINI_API_KEY`: API key for Google Gemini model inference.
   - `GOOGLE_CLOUD_PROJECT`: Google Cloud / Firebase Project ID.

3. **Database Security Rules Deployment:**
   Deploy `firestore.rules` to your Firebase project:
   ```bash
   # Deploy via Firebase CLI or AI Studio deploy tool
   firebase deploy --only firestore:rules
   ```

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

### 1. Complaints API

#### `GET /api/complaints`
Retrieve list of complaints with optional filtering.
- **Access**: Public / Authenticated Staff
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
- **Access**: Authenticated Staff / Admin (`Authorization: Bearer <token>`)

#### `DELETE /api/complaints/:id`
Archive a complaint.
- **Access**: Authenticated Admin (`Authorization: Bearer <token>`)

---

### 2. Maintenance Staff API

#### `GET /api/staff`
Get all maintenance personnel and current workload metrics.

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

## 📁 Project Configuration Files

- `metadata.json`: Contains application name, description, frame permissions, and server capabilities.
- `firebase-applet-config.json`: Platform web config containing Firebase project identification and client keys.
- `firestore.rules`: Security rules enforcing authorization boundaries on Firestore collections.
- `firebase-blueprint.json`: Initial blueprint schema definition for provisioned collections.

---

## 🎓 Research Presentation & Defense Limitations

When presenting CentIvate for academic defense or technical evaluation, note these intentional architectural scope decisions:

1. **Inline Photo Attachments**: Photos are currently stored as compressed base64 strings in Firestore documents (<500KB). Production recommendation is migrating to Google Cloud Storage / Firebase Storage buckets for high-resolution attachments.
2. **Authentication Domain Restriction**: Current authentication supports Firebase Auth and administrative fallback session verification. Production enterprise rollout recommends SSO SAML/OAuth restriction strictly to `@cpu.edu.ph` institutional accounts.
3. **Multi-tenant Expansion**: Built for single-institution campus deployment (Central Philippine University SHS). Multi-campus support requires tenant partitioning in Firestore schemas.
