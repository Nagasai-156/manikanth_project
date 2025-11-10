// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  college: string;
  degree?: string;
  course: string;
  year: string;
  profilePicture?: string;
  bio?: string;
  about?: string;
  skills?: string[];
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  slug: string;
  tier: string;
  category: string;
  description?: string;
  website?: string;
  logo?: string;
  logo_url?: string;
  experienceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Experience Types - SIMPLIFIED
export interface Experience {
  id: string;
  role: string;
  experience_type: 'Internship' | 'Full-Time' | 'Apprenticeship';
  result: 'Selected' | 'Not Selected' | 'Pending';
  interview_date?: string | null;
  location?: string | null;
  overall_experience?: string | null;
  technical_rounds?: string | null;
  hr_rounds?: string | null;
  tips_and_advice?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
  updated_at?: string;
  companies?: Company;
  users?: User;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  experience_id?: string;
  user_id?: string;
  parent_id?: string | null;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  edited_at?: string | null;
  likes_count?: number;
  users?: User; // Backend returns 'users' not 'user'
  user?: User; // Keep for backwards compatibility
  experienceTitle?: string;
  replies?: Comment[];
}

// Chat Types
export interface Chat {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

// Filter Types
export interface ExperienceFilters {
  page?: number;
  limit?: number;
  experienceType?: string;
  result?: string;
  branch?: string;
  company?: string;
  companyId?: string;
  userId?: string;
  status?: string;
  search?: string;
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  tier?: string;
  category?: string;
  search?: string;
}

// Form Data Types - SIMPLIFIED
export interface ExperienceFormData {
  companyId: string;
  customCompany?: string;
  role: string;
  experienceType: string;
  result: string;
  interviewDate?: string | null;
  location?: string | null;
  overallExperience?: string | null;
  technicalRounds?: string | null;
  hrRounds?: string | null;
  tipsAndAdvice?: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  rollNo?: string;
  college: string;
  degree?: string;
  course: string;
  year: string;
}