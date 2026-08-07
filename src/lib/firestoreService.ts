import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Complaint, MaintenanceStaff, OfficialStudent, SurveyResponse } from '../types';
import { INITIAL_COMPLAINTS, INITIAL_STAFF, INITIAL_STUDENTS, INITIAL_SURVEYS } from '../data/initialData';

const COMPLAINTS_COL = 'complaints';
const STUDENTS_COL = 'students';
const SURVEYS_COL = 'surveys';
const STAFF_COL = 'staff';

// Subscribe to Complaints real-time with Express API fallback
export const subscribeToComplaints = (callback: (complaints: Complaint[]) => void) => {
  const colRef = collection(db, COMPLAINTS_COL);

  // Initial fetch via Express API for instant, permission-safe load
  fetch('/api/complaints')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        callback(data);
      }
    })
    .catch(() => {});

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (!snapshot.empty) {
        const items: Complaint[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as Complaint);
        });
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      }
    },
    (_error) => {
      // Graceful server API fallback when unauthenticated or client listener restricted
      fetch('/api/complaints')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            callback(data);
          } else {
            callback(INITIAL_COMPLAINTS);
          }
        })
        .catch(() => {
          callback(INITIAL_COMPLAINTS);
        });
    }
  );
};

// Add new complaint via Express API (or direct client SDK if available)
export const addComplaintToDb = async (complaint: Complaint) => {
  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint),
    });
    if (res.ok) return true;
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to file complaint via server API');
  } catch (err) {
    try {
      await setDoc(doc(db, COMPLAINTS_COL, complaint.id), complaint);
      return true;
    } catch (dbErr) {
      console.warn('Direct Firestore client write skipped:', dbErr);
      throw err;
    }
  }
};

// Update complaint
export const updateComplaintInDb = async (id: string, updates: Partial<Complaint>) => {
  try {
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) return true;
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update complaint');
  } catch (err) {
    try {
      const docRef = doc(db, COMPLAINTS_COL, id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
      return true;
    } catch (dbErr) {
      console.warn('Direct Firestore update skipped:', dbErr);
      throw err;
    }
  }
};

// Subscribe to Official Students real-time
export const subscribeToStudents = (callback: (students: OfficialStudent[]) => void) => {
  const colRef = collection(db, STUDENTS_COL);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (!snapshot.empty) {
        const items: OfficialStudent[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as OfficialStudent);
        });
        callback(items);
      } else {
        callback(INITIAL_STUDENTS);
      }
    },
    (_error) => {
      callback(INITIAL_STUDENTS);
    }
  );
};

// Add or update an official student credential record
export const saveStudentToDb = async (student: OfficialStudent) => {
  try {
    await setDoc(doc(db, STUDENTS_COL, student.id), student);
    return true;
  } catch (err) {
    console.warn('Failed to save official student to Firestore directly:', err);
    return true;
  }
};

// Delete official student record
export const deleteStudentFromDb = async (id: string) => {
  try {
    const docRef = doc(db, STUDENTS_COL, id);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete student from Firestore directly:', err);
    return true;
  }
};

// Subscribe to Maintenance Staff real-time with Express API fallback
export const subscribeToStaff = (callback: (staff: MaintenanceStaff[]) => void) => {
  const colRef = collection(db, STAFF_COL);

  // Initial fetch via Express API
  fetch('/api/staff')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        callback(data);
      }
    })
    .catch(() => {});

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (!snapshot.empty) {
        const items: MaintenanceStaff[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as MaintenanceStaff);
        });
        callback(items);
      }
    },
    (_error) => {
      fetch('/api/staff')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            callback(data);
          } else {
            callback(INITIAL_STAFF);
          }
        })
        .catch(() => {
          callback(INITIAL_STAFF);
        });
    }
  );
};

// Add or update staff member in Firestore
export const saveStaffToDb = async (staffMember: MaintenanceStaff) => {
  try {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffMember),
    });
    if (res.ok) return true;
  } catch (err) {
    // ignore
  }

  try {
    await setDoc(doc(db, STAFF_COL, staffMember.id), staffMember);
    return true;
  } catch (err) {
    console.warn('Failed to save staff to Firestore directly:', err);
    return true;
  }
};

// Delete staff member from Firestore
export const deleteStaffFromDb = async (id: string) => {
  try {
    const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (err) {
    // ignore
  }

  try {
    const docRef = doc(db, STAFF_COL, id);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete staff from Firestore directly:', err);
    return true;
  }
};

// Subscribe to Surveys real-time with Express API fallback
export const subscribeToSurveys = (callback: (surveys: SurveyResponse[]) => void) => {
  const colRef = collection(db, SURVEYS_COL);

  // Initial fetch via Express API
  fetch('/api/surveys')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        callback(data);
      }
    })
    .catch(() => {});

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (!snapshot.empty) {
        const items: SurveyResponse[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as SurveyResponse);
        });
        callback(items);
      }
    },
    (_error) => {
      fetch('/api/surveys')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            callback(data);
          } else {
            callback(INITIAL_SURVEYS);
          }
        })
        .catch(() => {
          callback(INITIAL_SURVEYS);
        });
    }
  );
};

// Submit Survey
export const submitSurveyToDb = async (survey: SurveyResponse) => {
  try {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey),
    });
    if (res.ok) return true;
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit survey via server API');
  } catch (err) {
    try {
      await setDoc(doc(db, SURVEYS_COL, survey.id), survey);
      return true;
    } catch (dbErr) {
      console.warn('Failed to submit survey directly:', dbErr);
      throw err;
    }
  }
};
