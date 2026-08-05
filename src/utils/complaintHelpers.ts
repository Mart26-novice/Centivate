import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus, BuildingLocation } from '../types';

/**
 * Generates a standard tracking code for new complaints.
 * Format: CMP-YYYY-XXXX
 */
export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const randomHex = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${year}-${randomHex}`;
}

/**
 * Maps a complaint status string to its workflow step index.
 * 0: Filed
 * 1: Pending
 * 2: In Progress
 * 3: Resolved
 * -1: Cancelled
 */
export function getStepIndex(currentStatus: ComplaintStatus | string): number {
  const s = (currentStatus || '').toLowerCase().trim();
  if (s === 'filed') return 0;
  if (s === 'pending') return 1;
  if (s === 'in progress' || s === 'inprogress' || s === 'ongoing') return 2;
  if (s === 'resolved' || s === 'completed' || s === 'done' || s === 'fixed') return 3;
  if (s === 'cancelled' || s === 'canceled') return -1;
  return 0;
}

/**
 * Validates whether a complaint form payload meets minimum requirements.
 */
export function validateComplaintPayload(payload: {
  title?: string;
  category?: string;
  description?: string;
  locationBuilding?: string;
  studentName?: string;
  contactEmail?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!payload.title || !payload.title.trim()) {
    errors.title = 'Title is required.';
  }
  if (!payload.category || !payload.category.trim()) {
    errors.category = 'Category is required.';
  }
  if (!payload.description || payload.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters long.';
  }
  if (!payload.locationBuilding || !payload.locationBuilding.trim()) {
    errors.locationBuilding = 'Building location is required.';
  }
  if (!payload.studentName || !payload.studentName.trim()) {
    errors.studentName = 'Student name is required.';
  }
  if (!payload.contactEmail || !payload.contactEmail.includes('@')) {
    errors.contactEmail = 'A valid email address is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Filters a collection of complaints based on search query and status/category filters.
 */
export function filterComplaints(
  complaints: Complaint[],
  options: {
    searchTerm?: string;
    statusFilter?: string;
    categoryFilter?: string;
    priorityFilter?: string;
  }
): Complaint[] {
  const { searchTerm = '', statusFilter = 'All', categoryFilter = 'All', priorityFilter = 'All' } = options;
  const term = searchTerm.toLowerCase().trim();

  return complaints.filter((c) => {
    const studentName = c.studentName || '';
    // Search match
    const matchesSearch =
      !term ||
      c.trackingCode.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.locationBuilding.toLowerCase().includes(term) ||
      c.locationRoom.toLowerCase().includes(term) ||
      studentName.toLowerCase().includes(term);

    // Status match
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    // Category match
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;

    // Priority match
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });
}

/**
 * Automatically infers priority level based on category and facility safety urgency.
 */
export function inferPriority(category: ComplaintCategory, location: string): ComplaintPriority {
  const loc = location.toLowerCase();
  if (category === 'Lighting & Electrical' || loc.includes('main building') || loc.includes('lab')) {
    return 'Urgent / Hazard';
  }
  if (category === 'Plumbing & Water' || category === 'Restroom & Sanitation') {
    return 'High';
  }
  if (category === 'HVAC & Ventilation' || category === 'Classroom Furniture') {
    return 'Medium';
  }
  return 'Low';
}
