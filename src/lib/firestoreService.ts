import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { Complaint, MaintenanceStaff, OfficialStudent, UserSession } from '../types';

const COMPLAINTS_COL = 'complaints';
const STUDENTS_COL = 'students';

const POLL_INTERVAL_MS = 30000;

// Attaches the signed-in user's Firebase ID token so the Express API can identify them.
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = auth?.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
};

// JSON request to the Express API. Throws an Error carrying the server's message on failure,
// so callers can show it instead of pretending the action worked.
export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = { ...(await getAuthHeaders()) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

export const fetchComplaints = () => apiFetch<Complaint[]>('/api/complaints');
export const fetchStaff = () => apiFetch<MaintenanceStaff[]>('/api/staff');

// Restores the signed-in user's session (role/name come from their users/{uid} profile) on page load.
export const watchSession = (callback: (user: UserSession | null) => void) =>
  onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      // No profile yet = mid-signup; the login modal reports the session once setup finishes.
      if (!snap.exists()) return;
      const profile = snap.data() as Partial<UserSession>;
      const email = fbUser.email || '';
      callback({
        id: fbUser.uid,
        username: email.split('@')[0],
        email,
        role: (profile.role as UserSession['role']) || 'student',
        fullName: profile.fullName || email,
        strandOrDepartment: profile.strandOrDepartment || '',
      });
    } catch (err) {
      console.warn('Could not restore session profile:', err);
    }
  });

export const signOutUser = () => signOut(auth);

// Complaints: the API is authoritative and scopes what each requester may see (admin = everything,
// student = own reports in full + anonymous aggregates). Admins additionally get realtime updates
// from Firestore; for everyone else the security rules deny the listener, so polling covers them.
export const subscribeToComplaints = (callback: (complaints: Complaint[]) => void) => {
  let stopped = false;

  const load = () =>
    fetchComplaints()
      .then((data) => {
        if (!stopped) callback(data);
      })
      .catch((err) => console.warn('Complaint fetch failed:', err));

  load();
  const timer = setInterval(load, POLL_INTERVAL_MS);

  const unsubscribeSnapshot = onSnapshot(
    collection(db, COMPLAINTS_COL),
    (snapshot) => {
      if (stopped) return;
      const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Complaint);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    () => {
      // Expected for non-admins (rules deny listing); the polling above still serves them.
    }
  );

  return () => {
    stopped = true;
    clearInterval(timer);
    unsubscribeSnapshot();
  };
};

export const subscribeToStaff = (callback: (staff: MaintenanceStaff[]) => void) => {
  let stopped = false;

  const load = () =>
    fetchStaff()
      .then((data) => {
        if (!stopped) callback(data);
      })
      .catch((err) => console.warn('Staff fetch failed:', err));

  load();
  const timer = setInterval(load, POLL_INTERVAL_MS);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
};

// Official student directory (admin-only under the security rules).
export const subscribeToStudents = (callback: (students: OfficialStudent[]) => void) =>
  onSnapshot(
    collection(db, STUDENTS_COL),
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as OfficialStudent));
    },
    () => {
      callback([]);
    }
  );

export const saveStudentToDb = async (student: OfficialStudent) => {
  await setDoc(doc(db, STUDENTS_COL, student.id), student);
};

export const deleteStudentFromDb = async (id: string) => {
  await deleteDoc(doc(db, STUDENTS_COL, id));
};
