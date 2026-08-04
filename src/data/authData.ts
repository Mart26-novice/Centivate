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
