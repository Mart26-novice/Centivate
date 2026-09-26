// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

// The API runs in its in-memory demo mode here: no Firebase credentials are configured.
delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
process.env.ADMIN_DEV_BYPASS_TOKEN = 'test-bypass-token';

let server: Server;
let base: string;
let isAllowlistedAdmin: (decoded: any) => boolean;
let isValidImagePayload: (value: unknown) => boolean;

const ADMIN = { 'x-admin-authorization': 'test-bypass-token' };
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const validComplaint = {
  title: 'Broken ceiling fan',
  description: 'The ceiling fan in the room wobbles and makes a loud noise.',
  category: 'HVAC & Ventilation',
  locationBuilding: 'Senior High Building C',
  locationRoom: 'Room 204',
  priority: 'Medium',
  studentName: 'Juan Dela Cruz',
  studentStrand: 'STEM 12-A',
  contactEmail: 'juan@example.com',
  isAnonymous: false,
};

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { ...JSON_HEADERS, ...headers }, body: JSON.stringify(body) });

const patch = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, { method: 'PATCH', headers: { ...JSON_HEADERS, ...headers }, body: JSON.stringify(body) });

beforeAll(async () => {
  const mod = await import('../../api/app');
  isAllowlistedAdmin = mod.isAllowlistedAdmin;
  isValidImagePayload = mod.isValidImagePayload;
  server = mod.default.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe('Admin identification', () => {
  it('honours the allowlist only for verified emails', () => {
    expect(isAllowlistedAdmin({ email: 'admin@cpu.edu.ph', email_verified: true })).toBe(true);
    expect(isAllowlistedAdmin({ email: 'ADMIN@cpu.edu.ph', email_verified: true })).toBe(true);
  });

  it('rejects an allowlisted email that is not verified (anyone can register any address)', () => {
    expect(isAllowlistedAdmin({ email: 'admin@cpu.edu.ph', email_verified: false })).toBe(false);
    expect(isAllowlistedAdmin({ email: 'admin@cpu.edu.ph' })).toBe(false);
  });

  it('rejects verified emails that are not on the allowlist', () => {
    expect(isAllowlistedAdmin({ email: 'someone@gmail.com', email_verified: true })).toBe(false);
    expect(isAllowlistedAdmin(undefined)).toBe(false);
  });
});

describe('Image payload validation', () => {
  it('accepts empty values and small base64 images', () => {
    expect(isValidImagePayload('')).toBe(true);
    expect(isValidImagePayload(undefined)).toBe(true);
    expect(isValidImagePayload('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });

  it('rejects external URLs, non-images and oversized payloads', () => {
    expect(isValidImagePayload('https://evil.example/pixel.png')).toBe(false);
    expect(isValidImagePayload('data:text/html;base64,PGh0bWw+')).toBe(false);
    expect(isValidImagePayload('data:image/png;base64,' + 'A'.repeat(500001))).toBe(false);
    expect(isValidImagePayload(12345)).toBe(false);
  });
});

describe('Privacy: complaint listing', () => {
  it('gives anonymous visitors an aggregate-only view with no identifying fields', async () => {
    const res = await fetch(`${base}/api/complaints`);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.length).toBeGreaterThan(0);
    for (const c of list) {
      expect(c.trackingCode).toBe('');
      expect(c.title).toBe('');
      expect(c.description).toBe('');
      expect(c.contactEmail).toBeUndefined();
      expect(c.studentName).toBeUndefined();
      expect(c.photoUrl).toBeUndefined();
      expect(c.ownerUid).toBeUndefined();
      expect(c.status).toBeTruthy();
    }
  });

  it('gives admins the full records', async () => {
    const res = await fetch(`${base}/api/complaints`, { headers: ADMIN });
    const list = await res.json();
    expect(list.some((c: any) => c.trackingCode && c.title && c.description)).toBe(true);
    expect(list.every((c: any) => c.ownerUid === undefined)).toBe(true);
  });

  it('hides staff phone numbers and emails from the public but not from admins', async () => {
    const publicStaff = await (await fetch(`${base}/api/staff`)).json();
    expect(publicStaff.length).toBeGreaterThan(0);
    publicStaff.forEach((s: any) => {
      expect(s.phone).toBe('');
      expect(s.email).toBeUndefined();
    });

    const adminStaff = await (await fetch(`${base}/api/staff`, { headers: ADMIN })).json();
    expect(adminStaff.some((s: any) => s.phone)).toBe(true);
  });

  it('keeps survey responses admin-only', async () => {
    const anon = await fetch(`${base}/api/surveys`);
    expect([401, 403, 503]).toContain(anon.status);
    const admin = await fetch(`${base}/api/surveys`, { headers: ADMIN });
    expect(admin.status).toBe(200);
  });
});

describe('Complaint filing', () => {
  it('rejects unknown categories, buildings and priorities', async () => {
    expect((await post('/api/complaints', { ...validComplaint, category: 'Nonsense' })).status).toBe(400);
    expect((await post('/api/complaints', { ...validComplaint, locationBuilding: 'Nowhere' })).status).toBe(400);
    expect((await post('/api/complaints', { ...validComplaint, priority: 'Catastrophic' })).status).toBe(400);
  });

  it('rejects external photo URLs', async () => {
    const res = await post('/api/complaints', { ...validComplaint, photoUrl: 'https://evil.example/x.png' });
    expect(res.status).toBe(400);
  });

  it('creates exactly one complaint with a tracking code, and it can be tracked', async () => {
    const before = (await (await fetch(`${base}/api/complaints`, { headers: ADMIN })).json()).length;
    const res = await post('/api/complaints', validComplaint);
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.trackingCode).toMatch(/^CENT-2026-[A-Z0-9]{6}$/);
    expect(created.status).toBe('Filed');

    const after = (await (await fetch(`${base}/api/complaints`, { headers: ADMIN })).json()).length;
    expect(after).toBe(before + 1);

    const tracked = await fetch(`${base}/api/complaints/track/${created.trackingCode.toLowerCase()}`);
    expect(tracked.status).toBe(200);
    const trackedBody = await tracked.json();
    expect(trackedBody.title).toBe(validComplaint.title);
    expect(trackedBody.contactEmail).toBeUndefined();
    expect(trackedBody.studentName).toBeUndefined();
  });

  it('stores no personal details for anonymous reports', async () => {
    const res = await post('/api/complaints', { ...validComplaint, isAnonymous: true });
    const created = await res.json();
    expect(created.studentName).toBe('Anonymous Student');
    expect(created.contactEmail).toBe('');
    expect(created.ownerUid).toBeUndefined();
  });

  it('returns 404 for an unknown tracking code', async () => {
    expect((await fetch(`${base}/api/complaints/track/CENT-2026-ZZZZZZ`)).status).toBe(404);
  });

  it('answers malformed JSON with a clean 400 instead of hanging', async () => {
    const res = await fetch(`${base}/api/complaints`, { method: 'POST', headers: JSON_HEADERS, body: '{not json' });
    expect(res.status).toBe(400);
  });
});

describe('Complaint updates (admin only, audited)', () => {
  const firstComplaintId = async () => (await (await fetch(`${base}/api/complaints`, { headers: ADMIN })).json())[0].id;

  it('refuses updates without admin credentials', async () => {
    const id = await firstComplaintId();
    const res = await patch(`/api/complaints/${id}`, { status: 'Resolved' });
    expect([401, 403, 503]).toContain(res.status);
  });

  it('rejects invalid status and priority values', async () => {
    const id = await firstComplaintId();
    expect((await patch(`/api/complaints/${id}`, { status: 'Whatever' }, ADMIN)).status).toBe(400);
    expect((await patch(`/api/complaints/${id}`, { priority: 'Mega' }, ADMIN)).status).toBe(400);
  });

  it('records one audit entry per status change, attributed to the verified actor, not the client', async () => {
    const created = await (await post('/api/complaints', validComplaint)).json();
    const res = await patch(
      `/api/complaints/${created.id}`,
      { status: 'In Progress', note: 'Technician dispatched.', updatedBy: 'Forged Name' },
      ADMIN
    );
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.status).toBe('In Progress');
    expect(updated.logs).toHaveLength(created.logs.length + 1);
    const last = updated.logs[updated.logs.length - 1];
    expect(last.updatedBy).toBe('Administrator (dev)');
    expect(last.note).toBe('Technician dispatched.');
  });

  it('archives instead of deleting, and logs it', async () => {
    const created = await (await post('/api/complaints', validComplaint)).json();
    const res = await fetch(`${base}/api/complaints/${created.id}`, { method: 'DELETE', headers: ADMIN });
    expect(res.status).toBe(200);

    const visible = await (await fetch(`${base}/api/complaints`, { headers: ADMIN })).json();
    expect(visible.some((c: any) => c.id === created.id)).toBe(false);
    const withArchived = await (await fetch(`${base}/api/complaints?includeArchived=true`, { headers: ADMIN })).json();
    expect(withArchived.find((c: any) => c.id === created.id)?.isArchived).toBe(true);
  });

  it('returns 404 when updating a complaint that does not exist', async () => {
    expect((await patch('/api/complaints/CMP-does-not-exist', { status: 'Resolved' }, ADMIN)).status).toBe(404);
  });
});

describe('Staff management', () => {
  it('saves and returns the staff email used for assignment notifications', async () => {
    const res = await post(
      '/api/staff',
      { name: 'Test Technician', role: 'Electrician', specialty: 'Lighting & Electrical', phone: '0917-111-2222', email: 'tech@example.com' },
      ADMIN
    );
    expect(res.status).toBe(201);
    const staff = await res.json();
    expect(staff.email).toBe('tech@example.com');

    const listed = await (await fetch(`${base}/api/staff`, { headers: ADMIN })).json();
    expect(listed.find((s: any) => s.id === staff.id)?.email).toBe('tech@example.com');

    const edited = await patch(`/api/staff/${staff.id}`, { email: 'new@example.com' }, ADMIN);
    expect((await edited.json()).email).toBe('new@example.com');
  });

  it('rejects an invalid staff email and unauthenticated writes', async () => {
    const bad = await post('/api/staff', { name: 'X Y', role: 'Plumber', specialty: 'Plumbing & Water', email: 'not-an-email' }, ADMIN);
    expect(bad.status).toBe(400);
    const anon = await post('/api/staff', { name: 'X Y', role: 'Plumber', specialty: 'Plumbing & Water' });
    expect([401, 403, 503]).toContain(anon.status);
  });
});

describe('Surveys', () => {
  const survey = { role: 'Student', susQ1: 4, susQ2: 5, susQ3: 4, susQ4: 3, susQ5: 5, feedbackComments: 'Easy to use.' };

  it('rejects incomplete or out-of-range answers instead of defaulting them to 5', async () => {
    expect((await post('/api/surveys', { ...survey, susQ3: undefined })).status).toBe(400);
    expect((await post('/api/surveys', { ...survey, susQ1: 9 })).status).toBe(400);
    expect((await post('/api/surveys', { ...survey, susQ2: '5' })).status).toBe(400);
    expect((await post('/api/surveys', { ...survey, role: 'Hacker' })).status).toBe(400);
  });

  it('accepts a valid response and reflects it in the stats', async () => {
    const before = await (await fetch(`${base}/api/stats`)).json();
    const res = await post('/api/surveys', survey);
    expect(res.status).toBe(201);
    const after = await (await fetch(`${base}/api/stats`)).json();
    expect(after.surveyCount).toBe(before.surveyCount + 1);
  });
});

describe('Signup endpoint', () => {
  it('refuses to create profiles when the server has no Firebase Admin credentials', async () => {
    const res = await post('/api/auth/profile', { accessCode: 'x', role: 'admin', fullName: 'Someone' });
    expect(res.status).toBe(503);
  });
});

describe('Security headers', () => {
  it('sets hardening headers and does not advertise Express', async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-powered-by')).toBeNull();
  });
});
