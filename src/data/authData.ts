export type UserRole = 'student' | 'admin';

export interface UserSession {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  strandOrDepartment?: string;
}

export const PRESET_USERS = {
  student: {
    username: 'student',
    email: 'student.shs@cpu.edu.ph',
    role: 'student' as UserRole,
    fullName: 'Juan De La Cruz',
    strandOrDepartment: 'STEM 12-A',
  },
  admin: {
    username: 'admin',
    email: 'admin.facilities@cpu.edu.ph',
    role: 'admin' as UserRole,
    fullName: 'Engr. Roberto Santos (Facilities Admin)',
    strandOrDepartment: 'Campus Physical Plant Office',
  },
};

export const PRESET_STUDENTS: UserSession[] = [
  {
    id: 'USR-STU-001',
    username: 'juan.delacruz',
    email: 'student.shs@cpu.edu.ph',
    role: 'student' as UserRole,
    fullName: 'Juan De La Cruz',
    strandOrDepartment: 'STEM 12-A',
  },
  {
    id: 'USR-STU-002',
    username: 'marc.reyes',
    email: 'm.reyes.student@shs.edu.ph',
    role: 'student' as UserRole,
    fullName: 'Marc Vincent Reyes',
    strandOrDepartment: 'STEM 12-A',
  },
  {
    id: 'USR-STU-003',
    username: 'alyssa.mendoza',
    email: 'alyssa.mendoza@shs.edu.ph',
    role: 'student' as UserRole,
    fullName: 'Alyssa Mendoza',
    strandOrDepartment: 'STEM 11-C',
  },
  {
    id: 'USR-STU-004',
    username: 'joshua.tan',
    email: 'joshua.tan@shs.edu.ph',
    role: 'student' as UserRole,
    fullName: 'Joshua Tan',
    strandOrDepartment: 'ABM 12-B',
  },
  {
    id: 'USR-STU-005',
    username: 'bea.cruz',
    email: 'bea.cruz@shs.edu.ph',
    role: 'student' as UserRole,
    fullName: 'Bea Patricia Cruz',
    strandOrDepartment: 'TVL-ICT 12-A',
  },
  {
    id: 'USR-STU-006',
    username: 'gab.fernandez',
    email: 'gab.fernandez@shs.edu.ph',
    role: 'student' as UserRole,
    fullName: 'Gabriel Fernandez',
    strandOrDepartment: 'SPORTS 12-A',
  },
];
