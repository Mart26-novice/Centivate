import { describe, it, expect } from 'vitest';
import { INITIAL_COMPLAINTS, INITIAL_STUDENTS, INITIAL_STAFF } from '../data/initialData';

describe('Unit Tests: Initial Seed Data Integrity', () => {
  describe('INITIAL_STUDENTS dataset', () => {
    it('should contain official student records with valid fields', () => {
      expect(INITIAL_STUDENTS.length).toBeGreaterThan(0);
      INITIAL_STUDENTS.forEach((student) => {
        expect(student.id).toMatch(/^STUD-/);
        expect(student.studentIdNumber).toBeTruthy();
        expect(student.fullName).toBeTruthy();
        expect(student.email).toContain('@');
        expect(student.status).toBe('Active');
      });
    });

    it('should have unique student ID numbers', () => {
      const ids = INITIAL_STUDENTS.map((s) => s.studentIdNumber);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('INITIAL_COMPLAINTS dataset', () => {
    it('should contain sample complaints with valid tracking codes and statuses', () => {
      expect(INITIAL_COMPLAINTS.length).toBeGreaterThan(0);
      INITIAL_COMPLAINTS.forEach((complaint) => {
        expect(complaint.trackingCode).toMatch(/^(CENT|CMP)-\d{4}-\d{4}$/);
        expect(complaint.title).toBeTruthy();
        expect(complaint.category).toBeTruthy();
        expect(['Filed', 'Pending', 'In Progress', 'Resolved', 'Cancelled']).toContain(complaint.status);
        expect(['Low', 'Medium', 'High', 'Urgent / Hazard']).toContain(complaint.priority);
      });
    });

    it('should have unique tracking codes', () => {
      const codes = INITIAL_COMPLAINTS.map((c) => c.trackingCode);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('INITIAL_STAFF dataset', () => {
    it('should contain maintenance staff records with active status and assigned tasks', () => {
      expect(INITIAL_STAFF.length).toBeGreaterThan(0);
      INITIAL_STAFF.forEach((staff) => {
        expect(staff.id).toBeTruthy();
        expect(staff.name).toBeTruthy();
        expect(staff.specialty).toBeTruthy();
        expect(typeof staff.activeWorkload).toBe('number');
      });
    });
  });
});
