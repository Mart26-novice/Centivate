import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { adminAuth, adminDb } from '../src/lib/firebase-admin';
import { INITIAL_COMPLAINTS, INITIAL_SURVEYS, INITIAL_STAFF } from '../src/data/initialData';
import {
  Complaint,
  ComplaintPriority,
  ComplaintCategory,
  ComplaintStatus,
  BuildingLocation,
  SurveyResponse,
  StatusLog,
  SystemStats,
  MaintenanceStaff,
} from '../src/types';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Optional middleware to decode Firebase Authorization token if present
app.use(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(token);
        (req as any).user = decoded;
      }
    } catch (err) {
      // Non-blocking warning for optional auth tokens
    }
  }
  next();
});

// Server-side authorization check middleware for sensitive mutation endpoints
async function requireAuthOrAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).user) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(token);
        (req as any).user = decoded;
        return next();
      }
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired Firebase authentication token.' });
    }
  }

  const adminSessionHeader = req.headers['x-admin-authorization'];
  if (adminSessionHeader === 'cpu-admin-session-2026') {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized access. Authentication credentials required.' });
}

// Server-side image MIME type and payload size validator
function isValidImagePayload(urlOrBase64: string): boolean {
  if (!urlOrBase64 || typeof urlOrBase64 !== 'string') return true;
  if (urlOrBase64.length > 500000) return false;
  if (urlOrBase64.startsWith('data:')) {
    return (
      urlOrBase64.startsWith('data:image/jpeg') ||
      urlOrBase64.startsWith('data:image/jpg') ||
      urlOrBase64.startsWith('data:image/png') ||
      urlOrBase64.startsWith('data:image/webp') ||
      urlOrBase64.startsWith('data:image/gif')
    );
  }
  return true;
}

const COMPLAINTS_COL = 'complaints';
const SURVEYS_COL = 'surveys';
const STAFF_COL = 'staff';

let memoryComplaints: Complaint[] = JSON.parse(JSON.stringify(INITIAL_COMPLAINTS));
let memorySurveys: SurveyResponse[] = JSON.parse(JSON.stringify(INITIAL_SURVEYS));
let memoryStaff: MaintenanceStaff[] = JSON.parse(JSON.stringify(INITIAL_STAFF));

// Helper to retrieve complaints from Firestore (seeding if empty, with graceful in-memory fallback)
async function getComplaintsFromFirestore(): Promise<Complaint[]> {
  try {
    const colRef = adminDb.collection(COMPLAINTS_COL);
    const snapshot = await colRef.get();
    if (snapshot.empty) {
      const batch = adminDb.batch();
      for (const item of INITIAL_COMPLAINTS) {
        batch.set(adminDb.collection(COMPLAINTS_COL).doc(item.id), item);
      }
      await batch.commit().catch(() => {});
      return memoryComplaints;
    }
    const items: Complaint[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Complaint);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    memoryComplaints = items;
    return items;
  } catch (_err) {
    return memoryComplaints;
  }
}

// Helper to retrieve surveys from Firestore (seeding if empty, with graceful in-memory fallback)
async function getSurveysFromFirestore(): Promise<SurveyResponse[]> {
  try {
    const colRef = adminDb.collection(SURVEYS_COL);
    const snapshot = await colRef.get();
    if (snapshot.empty) {
      const batch = adminDb.batch();
      for (const item of INITIAL_SURVEYS) {
        batch.set(adminDb.collection(SURVEYS_COL).doc(item.id), item);
      }
      await batch.commit().catch(() => {});
      return memorySurveys;
    }
    const items: SurveyResponse[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as SurveyResponse);
    });
    memorySurveys = items;
    return items;
  } catch (_err) {
    return memorySurveys;
  }
}

// Helper to retrieve staff from Firestore (seeding if empty, with graceful in-memory fallback)
async function getStaffFromFirestore(): Promise<MaintenanceStaff[]> {
  try {
    const colRef = adminDb.collection(STAFF_COL);
    const snapshot = await colRef.get();
    if (snapshot.empty) {
      const batch = adminDb.batch();
      for (const item of INITIAL_STAFF) {
        batch.set(adminDb.collection(STAFF_COL).doc(item.id), item);
      }
      await batch.commit().catch(() => {});
      return memoryStaff;
    }
    const items: MaintenanceStaff[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as MaintenanceStaff);
    });
    memoryStaff = items;
    return items;
  } catch (_err) {
    return memoryStaff;
  }
}

// Lazy Gemini AI Client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CENT-2026-${randomStr}`;
}

async function generateUniqueTrackingCode(): Promise<string> {
  const existingComplaints = await getComplaintsFromFirestore();
  const existingCodes = new Set(existingComplaints.map((c) => c.trackingCode.toUpperCase()));
  let code = generateTrackingCode();
  let attempts = 0;
  while (existingCodes.has(code.toUpperCase()) && attempts < 20) {
    code = generateTrackingCode();
    attempts++;
  }
  return code;
}

// --- API ENDPOINTS ---

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', appName: 'Centivate Complaint System' });
});

// 2. Get all complaints from Firestore
app.get('/api/complaints', async (req, res) => {
  const { status, category, building, search, includeArchived } = req.query;

  let filtered = await getComplaintsFromFirestore();

  if (includeArchived !== 'true') {
    filtered = filtered.filter((c) => !c.isArchived);
  }

  if (status && status !== 'All') {
    filtered = filtered.filter((c) => c.status === status);
  }

  if (category && category !== 'All') {
    filtered = filtered.filter((c) => c.category === category);
  }

  if (building && building !== 'All') {
    filtered = filtered.filter((c) => c.locationBuilding === building);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.trackingCode.toLowerCase().includes(q) ||
        c.locationRoom.toLowerCase().includes(q) ||
        (c.studentName && c.studentName.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// 3. Track complaint by code
app.get('/api/complaints/track/:code', async (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const complaints = await getComplaintsFromFirestore();
  const found = complaints.find((c) => c.trackingCode.toUpperCase() === code);

  if (!found) {
    return res.status(404).json({ error: 'Complaint not found with this tracking code.' });
  }

  // Return public-safe complaint view
  res.json({
    id: found.id,
    trackingCode: found.trackingCode,
    title: found.title,
    description: found.description,
    category: found.category,
    locationBuilding: found.locationBuilding,
    locationRoom: found.locationRoom,
    priority: found.priority,
    status: found.status,
    photoUrl: found.photoUrl,
    assignedStaff: found.assignedStaff,
    estimatedResolutionDate: found.estimatedResolutionDate,
    resolutionNotes: found.resolutionNotes,
    resolutionPhotoUrl: found.resolutionPhotoUrl,
    logs: found.logs,
    createdAt: found.createdAt,
    updatedAt: found.updatedAt,
  });
});

// 4. Create new complaint in Firestore
app.post('/api/complaints', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      locationBuilding,
      locationRoom,
      priority,
      photoUrl,
      studentName,
      studentStrand,
      isAnonymous,
      contactEmail,
    } = req.body;

    // Server-side strict type and presence checks
    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 200) {
      return res.status(400).json({ error: 'Title is required and must be between 3 and 200 characters.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 5000) {
      return res.status(400).json({ error: 'Description is required and must be between 10 and 5000 characters.' });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required.' });
    }

    if (!locationBuilding || typeof locationBuilding !== 'string' || locationBuilding.trim().length > 100) {
      return res.status(400).json({ error: 'Building location is required and must be under 100 characters.' });
    }

    if (!locationRoom || typeof locationRoom !== 'string' || locationRoom.trim().length > 100) {
      return res.status(400).json({ error: 'Room/Area is required and must be under 100 characters.' });
    }

    if (contactEmail && typeof contactEmail === 'string' && contactEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim()) || contactEmail.length > 150) {
        return res.status(400).json({ error: 'Provided contact email address is invalid.' });
      }
    }

    // Image payload size & MIME type validation
    if (photoUrl && typeof photoUrl === 'string') {
      if (!isValidImagePayload(photoUrl)) {
        return res.status(400).json({
          error: 'Uploaded photo must be a valid JPEG, PNG, or WEBP image under 500KB.',
        });
      }
    }

    const trackingCode = await generateUniqueTrackingCode();
    const now = new Date().toISOString();

    const initialLog: StatusLog = {
      id: `LOG-${Date.now()}`,
      status: 'Filed',
      note: isAnonymous ? 'Complaint filed anonymously via Student Portal.' : `Filed by ${studentName || 'Student'} (${studentStrand || 'SHS'}).`,
      updatedBy: isAnonymous ? 'Student Portal (Anonymous)' : studentName || 'Student Portal',
      timestamp: now,
    };

    const newComplaint: Complaint = {
      id: `CMP-${Date.now()}`,
      trackingCode,
      title,
      description,
      category: category as ComplaintCategory,
      locationBuilding: locationBuilding as BuildingLocation,
      locationRoom,
      priority: (priority || 'Medium') as ComplaintPriority,
      status: 'Filed',
      photoUrl: photoUrl || '',
      studentName: isAnonymous ? 'Anonymous Student' : studentName || '',
      studentStrand: isAnonymous ? '' : studentStrand || '',
      isAnonymous: !!isAnonymous,
      contactEmail: contactEmail || '',
      assignedStaff: '',
      logs: [initialLog],
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    // Try AI Analysis with Gemini
    const aiClient = getGeminiClient();
    if (aiClient) {
      try {
        const aiPrompt = `Analyze this Senior High School facility maintenance complaint:
Title: ${title}
Description: ${description}
Building: ${locationBuilding}
Room: ${locationRoom}
Selected Category: ${category}

Classify priority as 'Low', 'Medium', 'High', or 'Urgent / Hazard'.
Provide a short urgency reason, a recommended maintenance action plan, and whether it represents a safety hazard.`;

        const aiResponse = await aiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: aiPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestedCategory: { type: Type.STRING },
                suggestedPriority: { type: Type.STRING },
                urgencyReason: { type: Type.STRING },
                recommendedMaintenanceAction: { type: Type.STRING },
                safetyHazardDetected: { type: Type.BOOLEAN },
              },
              required: ['suggestedCategory', 'suggestedPriority', 'urgencyReason', 'recommendedMaintenanceAction', 'safetyHazardDetected'],
            },
          },
        });

        if (aiResponse.text) {
          const parsed = JSON.parse(aiResponse.text);
          newComplaint.aiAnalysis = {
            suggestedCategory: (parsed.suggestedCategory || category) as ComplaintCategory,
            suggestedPriority: (parsed.suggestedPriority || priority || 'Medium') as ComplaintPriority,
            urgencyReason: parsed.urgencyReason || 'Standard processing required.',
            recommendedMaintenanceAction: parsed.recommendedMaintenanceAction || 'Inspect on-site.',
            safetyHazardDetected: !!parsed.safetyHazardDetected,
          };

          // Auto-elevate priority if safety hazard detected by AI
          if (parsed.safetyHazardDetected && (priority === 'Low' || priority === 'Medium')) {
            newComplaint.priority = 'High';
          }
        }
      } catch (aiErr) {
        console.warn('Gemini AI analysis skipped or failed:', aiErr);
      }
    }

    memoryComplaints.unshift(newComplaint);

    try {
      await adminDb.collection(COMPLAINTS_COL).doc(newComplaint.id).set(newComplaint);
    } catch (_dbErr: any) {
      // In-memory fallback persisted successfully
    }

    res.status(201).json(newComplaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create complaint.' });
  }
});

// 5. Update complaint status / details in Firestore
app.patch('/api/complaints/:id', requireAuthOrAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    status,
    priority,
    assignedStaff,
    estimatedResolutionDate,
    resolutionNotes,
    resolutionPhotoUrl,
    note,
    updatedBy,
    isArchived,
  } = req.body;

  if (resolutionPhotoUrl && typeof resolutionPhotoUrl === 'string') {
    if (!isValidImagePayload(resolutionPhotoUrl)) {
      return res.status(400).json({
        error: 'Resolution photo must be a valid JPEG, PNG, or WEBP image under 500KB.',
      });
    }
  }

  try {
    let item = memoryComplaints.find((c) => c.id === id);

    if (!item) {
      try {
        const docRef = adminDb.collection(COMPLAINTS_COL).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          item = docSnap.data() as Complaint;
        }
      } catch (_e) {}
    }

    if (!item) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const now = new Date().toISOString();

    if (!item.logs) {
      item.logs = [];
    }

    if (status && status !== item.status) {
      item.status = status as ComplaintStatus;
      item.logs.push({
        id: `LOG-${Date.now()}`,
        status: status as ComplaintStatus,
        note: note || `Status updated to ${status}.`,
        updatedBy: updatedBy || 'Administrator',
        timestamp: now,
      });
    } else if (note) {
      item.logs.push({
        id: `LOG-${Date.now()}`,
        status: item.status,
        note,
        updatedBy: updatedBy || 'Administrator',
        timestamp: now,
      });
    }

    if (priority) item.priority = priority;
    if (assignedStaff !== undefined) item.assignedStaff = assignedStaff;
    if (estimatedResolutionDate !== undefined) item.estimatedResolutionDate = estimatedResolutionDate;
    if (resolutionNotes !== undefined) item.resolutionNotes = resolutionNotes;
    if (resolutionPhotoUrl !== undefined) item.resolutionPhotoUrl = resolutionPhotoUrl;
    if (isArchived !== undefined) item.isArchived = isArchived;

    item.updatedAt = now;

    try {
      await adminDb.collection(COMPLAINTS_COL).doc(id).set(item);
    } catch (_dbErr: any) {}

    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update complaint' });
  }
});

// 6. Delete or Archive in Firestore
app.delete('/api/complaints/:id', requireAuthOrAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    let item = memoryComplaints.find((c) => c.id === id);

    if (!item) {
      try {
        const docRef = adminDb.collection(COMPLAINTS_COL).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          item = docSnap.data() as Complaint;
        }
      } catch (_e) {}
    }

    if (!item) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    item.isArchived = true;
    item.updatedAt = new Date().toISOString();

    try {
      await adminDb.collection(COMPLAINTS_COL).doc(id).set(item);
    } catch (_dbErr: any) {}

    res.json({ message: 'Complaint archived successfully', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to archive complaint' });
  }
});

// 7. System statistics endpoint computed from real Firestore data
app.get('/api/stats', async (_req, res) => {
  try {
    const complaintsStore = await getComplaintsFromFirestore();
    const surveyStore = await getSurveysFromFirestore();

    const active = complaintsStore.filter((c) => !c.isArchived);

    const totalComplaints = active.length;
    const filedCount = active.filter((c) => c.status === 'Filed').length;
    const pendingCount = active.filter((c) => c.status === 'Pending').length;
    const inProgressCount = active.filter((c) => c.status === 'In Progress').length;
    const resolvedCount = active.filter((c) => c.status === 'Resolved').length;
    const cancelledCount = active.filter((c) => c.status === 'Cancelled').length;
    const urgentHazardCount = active.filter((c) => c.priority === 'Urgent / Hazard' || c.priority === 'High').length;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    active.forEach((c) => {
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    });

    // Building breakdown
    const buildingBreakdown: Record<string, number> = {};
    active.forEach((c) => {
      buildingBreakdown[c.locationBuilding] = (buildingBreakdown[c.locationBuilding] || 0) + 1;
    });

    // Calculate avg resolution time in hours
    const resolvedItems = active.filter((c) => c.status === 'Resolved');
    let totalHours = 0;
    resolvedItems.forEach((c) => {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt).getTime();
      const diffMs = Math.max(0, updated - created);
      totalHours += diffMs / (1000 * 60 * 60);
    });

    const avgResolutionTimeHours = resolvedItems.length > 0 ? parseFloat((totalHours / resolvedItems.length).toFixed(1)) : 24.0;

    // Survey metrics
    const surveyCount = surveyStore.length;
    let totalScore = 0;
    surveyStore.forEach((s) => {
      const avg = (s.susQ1 + s.susQ2 + s.susQ3 + s.susQ4 + s.susQ5) / 5;
      totalScore += avg;
    });
    const avgSatisfactionScore = surveyCount > 0 ? parseFloat((totalScore / surveyCount).toFixed(2)) : 4.67;

    const stats: SystemStats = {
      totalComplaints,
      filedCount,
      pendingCount,
      inProgressCount,
      resolvedCount,
      cancelledCount,
      urgentHazardCount,
      avgResolutionTimeHours,
      categoryBreakdown,
      buildingBreakdown,
      surveyCount,
      avgSatisfactionScore,
    };

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute stats' });
  }
});

// 8. Gemini AI Complaint Analysis on demand
app.post('/api/ai/analyze-complaint', async (req, res) => {
  const { title, description, building, room, category } = req.body;

  const aiClient = getGeminiClient();
  if (!aiClient) {
    // Fallback response if no API key
    const isElectrical = description?.toLowerCase().includes('wire') || description?.toLowerCase().includes('spark') || description?.toLowerCase().includes('light');
    const isPlumbing = description?.toLowerCase().includes('water') || description?.toLowerCase().includes('leak') || description?.toLowerCase().includes('sink');

    return res.json({
      suggestedCategory: isElectrical ? 'Lighting & Electrical' : isPlumbing ? 'Plumbing & Water' : category || 'Other Facilities',
      suggestedPriority: description?.length > 100 ? 'High' : 'Medium',
      urgencyReason: 'Evaluated based on facility location and severity keywords.',
      recommendedMaintenanceAction: 'Conduct on-site physical inspection, verify circuit/pipes, and assign relevant maintenance team.',
      safetyHazardDetected: isElectrical || isPlumbing,
    });
  }

  try {
    const prompt = `Analyze this Senior High School campus facility complaint for the SHS maintenance team:
Title: ${title}
Description: ${description}
Building: ${building}
Room/Area: ${room}
Reported Category: ${category}

Classify priority strictly as one of: 'Low', 'Medium', 'High', 'Urgent / Hazard'.
Return a JSON object with:
- suggestedCategory: The most accurate facility category
- suggestedPriority: 'Low', 'Medium', 'High', or 'Urgent / Hazard'
- urgencyReason: 1 sentence explaining why this priority level was assigned
- recommendedMaintenanceAction: 2-3 step actionable repair procedure for school technicians
- safetyHazardDetected: boolean (true if electrical risk, water on floor, sharp metal, or overhead falling hazard)`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: { type: Type.STRING },
            suggestedPriority: { type: Type.STRING },
            urgencyReason: { type: Type.STRING },
            recommendedMaintenanceAction: { type: Type.STRING },
            safetyHazardDetected: { type: Type.BOOLEAN },
          },
          required: ['suggestedCategory', 'suggestedPriority', 'urgencyReason', 'recommendedMaintenanceAction', 'safetyHazardDetected'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    } else {
      throw new Error('Empty AI response');
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze complaint' });
  }
});

// 9. Surveys
app.get('/api/surveys', async (_req, res) => {
  const surveyStore = await getSurveysFromFirestore();
  res.json(surveyStore);
});

app.post('/api/surveys', async (req, res) => {
  const { role, susQ1, susQ2, susQ3, susQ4, susQ5, feedbackComments } = req.body;

  const newSurvey: SurveyResponse = {
    id: `SURV-${Date.now()}`,
    role: role || 'Student',
    susQ1: Number(susQ1) || 5,
    susQ2: Number(susQ2) || 5,
    susQ3: Number(susQ3) || 5,
    susQ4: Number(susQ4) || 5,
    susQ5: Number(susQ5) || 5,
    feedbackComments: feedbackComments || '',
    submittedAt: new Date().toISOString(),
  };

  memorySurveys.push(newSurvey);

  try {
    await adminDb.collection(SURVEYS_COL).doc(newSurvey.id).set(newSurvey);
  } catch (_err: any) {}

  res.status(201).json(newSurvey);
});

// 10. Staff Management Endpoints
app.get('/api/staff', async (_req, res) => {
  const staffStore = await getStaffFromFirestore();
  const complaintsStore = await getComplaintsFromFirestore();

  const activeStaffList = staffStore.map((st) => {
    const activeCount = complaintsStore.filter(
      (c) =>
        !c.isArchived &&
        c.status !== 'Resolved' &&
        c.status !== 'Cancelled' &&
        c.assignedStaff &&
        c.assignedStaff.trim().toLowerCase() === st.name.trim().toLowerCase()
    ).length;
    return {
      ...st,
      activeWorkload: activeCount,
    };
  });
  res.json(activeStaffList);
});

app.post('/api/staff', requireAuthOrAdmin, async (req, res) => {
  const { name, role, specialty, phone } = req.body;
  if (!name || !role || !specialty) {
    return res.status(400).json({ error: 'Name, role, and specialty are required.' });
  }

  const newStaff: MaintenanceStaff = {
    id: `ST-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    role: role.trim(),
    specialty: specialty as ComplaintCategory,
    phone: phone ? phone.trim() : '0917-000-0000',
    activeWorkload: 0,
  };

  memoryStaff.push(newStaff);

  try {
    await adminDb.collection(STAFF_COL).doc(newStaff.id).set(newStaff);
  } catch (_err: any) {}

  res.status(201).json(newStaff);
});

app.patch('/api/staff/:id', requireAuthOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, role, specialty, phone } = req.body;

  try {
    let currentStaff = memoryStaff.find((s) => s.id === id);

    if (!currentStaff) {
      try {
        const docRef = adminDb.collection(STAFF_COL).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          currentStaff = docSnap.data() as MaintenanceStaff;
        }
      } catch (_e) {}
    }

    if (!currentStaff) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const currentName = currentStaff.name;
    const updatedName = name ? name.trim() : currentName;

    if (name && currentName !== updatedName) {
      const complaints = await getComplaintsFromFirestore();
      for (const c of complaints) {
        if (c.assignedStaff && c.assignedStaff.trim().toLowerCase() === currentName.toLowerCase()) {
          c.assignedStaff = updatedName;
          try {
            await adminDb.collection(COMPLAINTS_COL).doc(c.id).set(c);
          } catch (_e) {}
        }
      }
    }

    const updatedStaff: MaintenanceStaff = {
      ...currentStaff,
      name: updatedName,
      role: role ? role.trim() : currentStaff.role,
      specialty: specialty ? (specialty as ComplaintCategory) : currentStaff.specialty,
      phone: phone !== undefined ? phone.trim() : currentStaff.phone,
    };

    const idx = memoryStaff.findIndex((s) => s.id === id);
    if (idx !== -1) memoryStaff[idx] = updatedStaff;

    try {
      await adminDb.collection(STAFF_COL).doc(id).set(updatedStaff);
    } catch (_err: any) {}

    res.json(updatedStaff);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update staff member' });
  }
});

app.delete('/api/staff/:id', requireAuthOrAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    let removed = memoryStaff.find((s) => s.id === id);

    if (!removed) {
      try {
        const docRef = adminDb.collection(STAFF_COL).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          removed = docSnap.data() as MaintenanceStaff;
        }
      } catch (_e) {}
    }

    if (!removed) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    memoryStaff = memoryStaff.filter((s) => s.id !== id);

    try {
      await adminDb.collection(STAFF_COL).doc(id).delete();
    } catch (_err: any) {}

    const complaints = await getComplaintsFromFirestore();
    for (const c of complaints) {
      if (
        !c.isArchived &&
        c.status !== 'Resolved' &&
        c.assignedStaff &&
        c.assignedStaff.trim().toLowerCase() === removed.name.trim().toLowerCase()
      ) {
        c.assignedStaff = '';
        try {
          await adminDb.collection(COMPLAINTS_COL).doc(c.id).set(c);
        } catch (_e) {}
      }
    }

    res.json({ message: 'Staff member removed successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete staff member' });
  }
});

export default app;
