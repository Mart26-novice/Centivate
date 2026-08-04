export type ComplaintStatus = 'Filed' | 'Pending' | 'In Progress' | 'Resolved' | 'Cancelled';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent / Hazard';

export type ComplaintCategory =
  | 'Restroom & Sanitation'
  | 'Classroom Furniture'
  | 'HVAC & Ventilation'
  | 'Lighting & Electrical'
  | 'Plumbing & Water'
  | 'IT & Audio-Visual'
  | 'Doors, Windows & Structure'
  | 'Grounds & Safety'
  | 'Other Facilities';

export type BuildingLocation =
  | 'Main Building A'
  | 'Science & Tech Wing B'
  | 'Senior High Building C'
  | 'Gymnasium & Sports Complex'
  | 'Library & Learning Commons'
  | 'Cafeteria & Student Center'
  | 'Campus Grounds';

export interface StatusLog {
  id: string;
  status: ComplaintStatus;
  note: string;
  updatedBy: string;
  timestamp: string;
}

export interface AIAnalysisResult {
  suggestedCategory: ComplaintCategory;
  suggestedPriority: ComplaintPriority;
  urgencyReason: string;
  recommendedMaintenanceAction: string;
  safetyHazardDetected: boolean;
}

export interface Complaint {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  locationBuilding: BuildingLocation;
  locationRoom: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  photoUrl?: string;
  studentName?: string;
  studentStrand?: string;
  isAnonymous: boolean;
  contactEmail?: string;
  assignedStaff?: string;
  estimatedResolutionDate?: string;
  resolutionNotes?: string;
  resolutionPhotoUrl?: string;
  logs: StatusLog[];
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  aiAnalysis?: AIAnalysisResult;
}

export interface SurveyResponse {
  id: string;
  role: 'Student' | 'Faculty/Admin' | 'Maintenance Staff';
  susQ1: number; // System was easy to use (1-5)
  susQ2: number; // Reporting complaints was fast and straightforward (1-5)
  susQ3: number; // Real-time status tracking provided clarity (1-5)
  susQ4: number; // The interface design and color layout are intuitive (1-5)
  susQ5: number; // System effectively improves campus maintenance workflow (1-5)
  feedbackComments?: string;
  submittedAt: string;
}

export interface MaintenanceStaff {
  id: string;
  name: string;
  role: string;
  specialty: ComplaintCategory;
  phone: string;
  activeWorkload: number;
}

export interface SystemStats {
  totalComplaints: number;
  filedCount: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  cancelledCount: number;
  urgentHazardCount: number;
  avgResolutionTimeHours: number;
  categoryBreakdown: Record<string, number>;
  buildingBreakdown: Record<string, number>;
  surveyCount: number;
  avgSatisfactionScore: number;
}
