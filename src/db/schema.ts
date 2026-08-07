import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: text('role').default('student'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const complaints = pgTable('complaints', {
  id: text('id').primaryKey(),
  trackingCode: text('tracking_code').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  locationBuilding: text('location_building').notNull(),
  locationRoom: text('location_room').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  photoUrl: text('photo_url'),
  studentName: text('student_name'),
  studentStrand: text('student_strand'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  contactEmail: text('contact_email'),
  assignedStaff: text('assigned_staff'),
  estimatedResolutionDate: text('estimated_resolution_date'),
  resolutionNotes: text('resolution_notes'),
  resolutionPhotoUrl: text('resolution_photo_url'),
  logs: jsonb('logs').$type<any[]>().default([]),
  aiAnalysis: jsonb('ai_analysis'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const surveyResponses = pgTable('survey_responses', {
  id: text('id').primaryKey(),
  role: text('role').notNull(),
  susQ1: integer('sus_q1').notNull(),
  susQ2: integer('sus_q2').notNull(),
  susQ3: integer('sus_q3').notNull(),
  susQ4: integer('sus_q4').notNull(),
  susQ5: integer('sus_q5').notNull(),
  feedbackComments: text('feedback_comments'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const officialStudents = pgTable('official_students', {
  id: text('id').primaryKey(),
  studentIdNumber: text('student_id_number').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  strandOrDepartment: text('strand_or_department').notNull(),
  yearLevel: text('year_level'),
  status: text('status').default('Active').notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
});
