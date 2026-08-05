import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Complaint, MaintenanceStaff, OfficialStudent, SurveyResponse } from '../types';
import { INITIAL_COMPLAINTS, INITIAL_STAFF, INITIAL_STUDENTS, INITIAL_SURVEYS } from '../data/initialData';

const COMPLAINTS_COL = 'complaints';
const STUDENTS_COL = 'students';
const SURVEYS_COL = 'surveys';
const STAFF_COL = 'staff';

// Subscribe to Complaints real-time
export const subscribeToComplaints = (callback: (complaints: Complaint[]) => void) => {
  const colRef = collection(db, COMPLAINTS_COL);
  
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      // Seed initial data if database collection is empty
      console.log('Seeding initial complaints to Firestore...');
      try {
        for (const item of INITIAL_COMPLAINTS) {
          await setDoc(doc(db, COMPLAINTS_COL, item.id), item);
        }
      } catch (err) {
        console.error('Error seeding complaints:', err);
      }
      callback(INITIAL_COMPLAINTS);
    } else {
      const items: Complaint[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Complaint);
      });
      // Sort by createdAt descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }
  }, (error) => {
    console.error('Firestore complaints listener error:', error);
    callback(INITIAL_COMPLAINTS);
  });
};

// Add new complaint
export const addComplaintToDb = async (complaint: Complaint) => {
  try {
    await setDoc(doc(db, COMPLAINTS_COL, complaint.id), complaint);
    return true;
  } catch (err) {
    console.error('Failed to add complaint to Firestore:', err);
    throw err;
  }
};

// Update complaint
export const updateComplaintInDb = async (id: string, updates: Partial<Complaint>) => {
  try {
    const docRef = doc(db, COMPLAINTS_COL, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error('Failed to update complaint in Firestore:', err);
    throw err;
  }
};

// Subscribe to Official Students real-time
export const subscribeToStudents = (callback: (students: OfficialStudent[]) => void) => {
  const colRef = collection(db, STUDENTS_COL);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Seeding initial official students to Firestore...');
      try {
        for (const item of INITIAL_STUDENTS) {
          await setDoc(doc(db, STUDENTS_COL, item.id), item);
        }
      } catch (err) {
        console.error('Error seeding students:', err);
      }
      callback(INITIAL_STUDENTS);
    } else {
      const items: OfficialStudent[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as OfficialStudent);
      });
      callback(items);
    }
  }, (error) => {
    console.error('Firestore students listener error:', error);
    callback(INITIAL_STUDENTS);
  });
};

// Add or update an official student credential record
export const saveStudentToDb = async (student: OfficialStudent) => {
  try {
    await setDoc(doc(db, STUDENTS_COL, student.id), student);
    return true;
  } catch (err) {
    console.error('Failed to save official student to Firestore:', err);
    throw err;
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
    console.error('Failed to delete student from Firestore:', err);
    throw err;
  }
};

// Subscribe to Maintenance Staff real-time
export const subscribeToStaff = (callback: (staff: MaintenanceStaff[]) => void) => {
  const colRef = collection(db, STAFF_COL);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Seeding initial staff to Firestore...');
      try {
        for (const item of INITIAL_STAFF) {
          await setDoc(doc(db, STAFF_COL, item.id), item);
        }
      } catch (err) {
        console.error('Error seeding staff:', err);
      }
      callback(INITIAL_STAFF);
    } else {
      const items: MaintenanceStaff[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as MaintenanceStaff);
      });
      callback(items);
    }
  }, (error) => {
    console.error('Firestore staff listener error:', error);
    callback(INITIAL_STAFF);
  });
};

// Add or update staff member in Firestore
export const saveStaffToDb = async (staffMember: MaintenanceStaff) => {
  try {
    await setDoc(doc(db, STAFF_COL, staffMember.id), staffMember);
    return true;
  } catch (err) {
    console.error('Failed to save staff to Firestore:', err);
    throw err;
  }
};

// Delete staff member from Firestore
export const deleteStaffFromDb = async (id: string) => {
  try {
    const docRef = doc(db, STAFF_COL, id);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Failed to delete staff from Firestore:', err);
    throw err;
  }
};

// Subscribe to Surveys real-time
export const subscribeToSurveys = (callback: (surveys: SurveyResponse[]) => void) => {
  const colRef = collection(db, SURVEYS_COL);

  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Seeding initial surveys to Firestore...');
      try {
        for (const item of INITIAL_SURVEYS) {
          await setDoc(doc(db, SURVEYS_COL, item.id), item);
        }
      } catch (err) {
        console.error('Error seeding surveys:', err);
      }
      callback(INITIAL_SURVEYS);
    } else {
      const items: SurveyResponse[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as SurveyResponse);
      });
      callback(items);
    }
  }, (error) => {
    console.error('Firestore surveys listener error:', error);
    callback(INITIAL_SURVEYS);
  });
};

// Submit Survey
export const submitSurveyToDb = async (survey: SurveyResponse) => {
  try {
    await setDoc(doc(db, SURVEYS_COL, survey.id), survey);
    return true;
  } catch (err) {
    console.error('Failed to submit survey to Firestore:', err);
    throw err;
  }
};
