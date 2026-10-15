export type UserRole = 'admin' | 'vice_principal' | 'lead' | 'teacher';

export type UserStatus = 'pending' | 'active' | 'disabled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  departmentId?: string; // 'khoi_1' | 'khoi_2' | 'khoi_3' | 'khoi_4' | 'khoi_5'
  departmentName?: string;
  status: UserStatus;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: string; // 'khoi_1', 'khoi_2', 'khoi_3', 'khoi_4', 'khoi_5'
  name: string; // 'Khối 1', 'Khối 2', ...
  gradeNumber: number; // 1 - 5
  leadUid?: string;
  leadName?: string;
  description?: string;
  teacherCount?: number;
  updatedAt?: string;
}

export type WorkflowType = 'direct_to_principal' | 'via_lead_then_principal';

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  workflowType: WorkflowType;
  allowedExtensions: string; // e.g. "doc, docx, pdf, xls, xlsx, ppt, pptx"
  maxSizeMb: number; // e.g. 25
  isActive: boolean;
  order: number;
}

export type DocumentStatus =
  | 'draft'               // Bản nháp
  | 'submitted'           // Đã nộp
  | 'pending_lead'        // Chờ tổ trưởng kiểm tra
  | 'pending_principal'   // Chờ Phó Hiệu trưởng kiểm tra
  | 'need_revision'       // Yêu cầu bổ sung
  | 'resubmitted'         // Đã nộp lại
  | 'approved'            // Đã phê duyệt
  | 'rejected';           // Từ chối / Không đạt

export interface DocumentVersion {
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  storagePath?: string;
  submittedAt: string;
  submittedByUid: string;
  submittedByName: string;
  notes?: string;
}

export type ActionType =
  | 'comment'
  | 'request_revision'
  | 'approve'
  | 'reject'
  | 'submit'
  | 'resubmit';

export interface DocumentComment {
  id?: string;
  authorUid: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  actionType: ActionType;
  createdAt: string;
}

export interface SchoolDocument {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  departmentId: string; // khoi_1 to khoi_5
  departmentName: string;
  academicYear: string; // e.g. "2025-2026"
  semester: 'HK1' | 'HK2' | 'CaNam';
  subject?: string;
  gradeClass?: string;
  weekOrPeriod?: string; // Tuần 1, Tuần 2, ...
  notes?: string;
  deadline?: string;
  status: DocumentStatus;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  currentVersion: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  storagePath?: string;
  reviewedByUid?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemNotification {
  id: string;
  targetUid: string;
  title: string;
  message: string;
  type: 'deadline' | 'review' | 'revision' | 'approval' | 'system';
  linkDocId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemConfig {
  schoolName: string;
  currentAcademicYear: string;
  currentSemester: string;
  allowSelfRegistration: boolean;
  updatedAt?: string;
}
