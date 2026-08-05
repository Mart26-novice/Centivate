import { describe, it, expect } from 'vitest';
import {
  generateTrackingCode,
  getStepIndex,
  validateComplaintPayload,
  filterComplaints,
  inferPriority,
} from '../utils/complaintHelpers';
import { Complaint } from '../types';

describe('Unit Tests: Complaint Helper Utilities', () => {
  describe('generateTrackingCode()', () => {
    it('should generate a tracking code starting with CMP-', () => {
      const code = generateTrackingCode();
      expect(code).toMatch(/^CMP-\d{4}-\d{4}$/);
    });

    it('should generate unique tracking codes on consecutive calls', () => {
      const code1 = generateTrackingCode();
      const code2 = generateTrackingCode();
      expect(code1).toBeDefined();
      expect(code2).toBeDefined();
    });
  });

  describe('getStepIndex()', () => {
    it('should return correct step index for standard statuses', () => {
      expect(getStepIndex('Filed')).toBe(0);
      expect(getStepIndex('Pending')).toBe(1);
      expect(getStepIndex('In Progress')).toBe(2);
      expect(getStepIndex('Resolved')).toBe(3);
      expect(getStepIndex('Cancelled')).toBe(-1);
    });

    it('should handle lowercase and trimmed input strings', () => {
      expect(getStepIndex('  filed  ')).toBe(0);
      expect(getStepIndex('pending')).toBe(1);
      expect(getStepIndex('in progress')).toBe(2);
      expect(getStepIndex('resolved')).toBe(3);
      expect(getStepIndex('cancelled')).toBe(-1);
    });

    it('should map alias statuses correctly', () => {
      expect(getStepIndex('completed')).toBe(3);
      expect(getStepIndex('ongoing')).toBe(2);
      expect(getStepIndex('fixed')).toBe(3);
      expect(getStepIndex('canceled')).toBe(-1);
    });
  });

  describe('validateComplaintPayload()', () => {
    it('should validate a complete and valid complaint payload', () => {
      const result = validateComplaintPayload({
        title: 'Broken AC Unit in Room 302',
        category: 'HVAC & Ventilation',
        description: 'The air conditioner is making loud noises and leaking water continuously.',
        locationBuilding: 'Main Building A',
        studentName: 'Maria Santos',
        contactEmail: 'm.santos@shs.edu.ph',
      });

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const result = validateComplaintPayload({
        title: '',
        category: '',
        description: 'Short',
        locationBuilding: '',
        studentName: '',
        contactEmail: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
      expect(result.errors.category).toBeDefined();
      expect(result.errors.description).toBeDefined();
      expect(result.errors.locationBuilding).toBeDefined();
      expect(result.errors.studentName).toBeDefined();
      expect(result.errors.contactEmail).toBeDefined();
    });
  });

  describe('filterComplaints()', () => {
    const mockComplaints: Complaint[] = [
      {
        id: '1',
        trackingCode: 'CMP-2026-1001',
        title: 'Broken Chair',
        description: 'Wobbly leg in Classroom 101',
        category: 'Classroom Furniture',
        status: 'Filed',
        priority: 'Low',
        locationBuilding: 'Main Building A',
        locationRoom: 'Classroom 101',
        studentName: 'Juan Dela Cruz',
        contactEmail: 'juan@test.com',
        isAnonymous: false,
        logs: [],
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        isArchived: false,
      },
      {
        id: '2',
        trackingCode: 'CMP-2026-1002',
        title: 'Water Leak',
        description: 'Leaking pipe in Restroom 2F',
        category: 'Plumbing & Water',
        status: 'In Progress',
        priority: 'High',
        locationBuilding: 'Senior High Building C',
        locationRoom: 'Restroom 2F',
        studentName: 'Ana Reyes',
        contactEmail: 'ana@test.com',
        isAnonymous: false,
        logs: [],
        createdAt: '2026-08-02T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
        isArchived: false,
      },
      {
        id: '3',
        trackingCode: 'CMP-2026-1003',
        title: 'Exposed Wire',
        description: 'Exposed electrical line near Main Office',
        category: 'Lighting & Electrical',
        status: 'Resolved',
        priority: 'Urgent / Hazard',
        locationBuilding: 'Main Building A',
        locationRoom: 'Main Office',
        studentName: 'Carlos Garcia',
        contactEmail: 'carlos@test.com',
        isAnonymous: false,
        logs: [],
        createdAt: '2026-08-03T00:00:00.000Z',
        updatedAt: '2026-08-03T00:00:00.000Z',
        isArchived: false,
      },
    ];

    it('should return all complaints when filters are default', () => {
      const filtered = filterComplaints(mockComplaints, {});
      expect(filtered).toHaveLength(3);
    });

    it('should filter complaints by tracking code search term', () => {
      const filtered = filterComplaints(mockComplaints, { searchTerm: 'CMP-2026-1002' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Water Leak');
    });

    it('should filter complaints by status', () => {
      const filtered = filterComplaints(mockComplaints, { statusFilter: 'Resolved' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].trackingCode).toBe('CMP-2026-1003');
    });

    it('should filter complaints by priority', () => {
      const filtered = filterComplaints(mockComplaints, { priorityFilter: 'High' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Water Leak');
    });
  });

  describe('inferPriority()', () => {
    it('should assign Urgent / Hazard priority to Lighting & Electrical or Lab locations', () => {
      expect(inferPriority('Lighting & Electrical', 'Classroom 201')).toBe('Urgent / Hazard');
      expect(inferPriority('Other Facilities', 'Lab room')).toBe('Urgent / Hazard');
    });

    it('should assign High priority to Plumbing & Water', () => {
      expect(inferPriority('Plumbing & Water', 'Building B 1F')).toBe('High');
    });

    it('should assign Medium priority to HVAC & Ventilation', () => {
      expect(inferPriority('HVAC & Ventilation', 'Classroom 102')).toBe('Medium');
    });
  });
});
