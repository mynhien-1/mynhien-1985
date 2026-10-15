import { Department, DocumentCategory, DocumentStatus, UserRole } from './types';

export const INITIAL_ADMIN_EMAIL = 'mynhienbobeo@gmail.com';

export const ACADEMIC_YEARS = [
  '2026-2027',
  '2027-2028',
  '2028-2029',
  '2029-2030',
  '2030-2031',
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'khoi_1', name: 'Tổ Khối 1', gradeNumber: 1, description: 'Tổ chuyên môn giáo viên giảng dạy Khối 1' },
  { id: 'khoi_2', name: 'Tổ Khối 2', gradeNumber: 2, description: 'Tổ chuyên môn giáo viên giảng dạy Khối 2' },
  { id: 'khoi_3', name: 'Tổ Khối 3', gradeNumber: 3, description: 'Tổ chuyên môn giáo viên giảng dạy Khối 3' },
  { id: 'khoi_4', name: 'Tổ Khối 4', gradeNumber: 4, description: 'Tổ chuyên môn giáo viên giảng dạy Khối 4' },
  { id: 'khoi_5', name: 'Tổ Khối 5', gradeNumber: 5, description: 'Tổ chuyên môn giáo viên giảng dạy Khối 5' },
];

export const DEFAULT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'kh-gd-to',
    name: 'Kế hoạch giáo dục của tổ chuyên môn',
    description: 'Kế hoạch thực hiện chương trình môn học/hoạt động giáo dục của tổ cả năm và từng học kỳ',
    workflowType: 'direct_to_principal',
    allowedExtensions: 'doc, docx, pdf',
    maxSizeMb: 25,
    isActive: true,
    order: 1,
  },
  {
    id: 'kh-gd-ca-nhan',
    name: 'Kế hoạch giáo dục cá nhân',
    description: 'Kế hoạch giảng dạy và phân phối chương trình của từng giáo viên',
    workflowType: 'via_lead_then_principal',
    allowedExtensions: 'doc, docx, pdf',
    maxSizeMb: 25,
    isActive: true,
    order: 2,
  },
  {
    id: 'giao-an-tuan',
    name: 'Kế hoạch bài dạy (Giáo án) theo tuần và môn',
    description: 'Kế hoạch bài dạy chi tiết từng môn học theo tuần phục vụ giảng dạy trên lớp',
    workflowType: 'via_lead_then_principal',
    allowedExtensions: 'doc, docx, pdf, ppt, pptx',
    maxSizeMb: 30,
    isActive: true,
    order: 3,
  },
  {
    id: 'hs-danh-gia-hs',
    name: 'Hồ sơ kiểm tra, đánh giá học sinh',
    description: 'Bảng theo dõi sự tiến bộ, phiếu kiểm tra định kì, sổ theo dõi đánh giá học sinh',
    workflowType: 'via_lead_then_principal',
    allowedExtensions: 'doc, docx, pdf, xls, xlsx',
    maxSizeMb: 25,
    isActive: true,
    order: 4,
  },
  {
    id: 'hs-sinh-hoat-cm',
    name: 'Hồ sơ sinh hoạt chuyên môn',
    description: 'Biên bản các buổi họp, sinh hoạt định kỳ 2 tuần/lần của tổ khối',
    workflowType: 'direct_to_principal',
    allowedExtensions: 'doc, docx, pdf',
    maxSizeMb: 25,
    isActive: true,
    order: 5,
  },
  {
    id: 'hs-chuyen-de-ncbh',
    name: 'Hồ sơ chuyên đề, nghiên cứu bài học',
    description: 'Kế hoạch, biên bản tổ chức thao giảng, hội thảo chuyên đề và nghiên cứu bài học',
    workflowType: 'via_lead_then_principal',
    allowedExtensions: 'doc, docx, pdf, ppt, pptx',
    maxSizeMb: 30,
    isActive: true,
    order: 6,
  },
  {
    id: 'bao-cao-dinh-ki',
    name: 'Báo cáo chuyên môn định kì',
    description: 'Báo cáo sơ kết tháng, giữa học kỳ, cuối kỳ của tổ chuyên môn',
    workflowType: 'direct_to_principal',
    allowedExtensions: 'doc, docx, pdf, xls, xlsx',
    maxSizeMb: 25,
    isActive: true,
    order: 7,
  },
  {
    id: 'hs-khac',
    name: 'Hồ sơ khác do nhà trường quy định',
    description: 'Sổ chủ nhiệm, hồ sơ bồi dưỡng học sinh, hồ sơ phụ đạo học sinh cần hỗ trợ...',
    workflowType: 'via_lead_then_principal',
    allowedExtensions: 'doc, docx, pdf, xls, xlsx, ppt, pptx',
    maxSizeMb: 25,
    isActive: true,
    order: 8,
  },
];

export const PRIMARY_SUBJECTS = [
  'Toán',
  'Tiếng Việt',
  'Tiếng Anh',
  'Tự nhiên và Xã hội',
  'Lịch sử và Địa lí',
  'Khoa học',
  'Đạo đức',
  'Âm nhạc',
  'Mĩ thuật',
  'Giáo dục thể chất',
  'Tin học và Công nghệ',
  'Hoạt động trải nghiệm',
];

export const STATUS_MAP: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string; description: string }
> = {
  draft: {
    label: 'Bản nháp',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    description: 'Hồ sơ lưu nháp, chưa gửi kiểm tra',
  },
  submitted: {
    label: 'Đã nộp',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    description: 'Đã nộp, đang trong hàng đợi xử lý',
  },
  pending_lead: {
    label: 'Chờ Tổ trưởng kiểm tra',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    description: 'Chờ Tổ trưởng chuyên môn xem xét, nhận xét và chuyển tiếp',
  },
  pending_principal: {
    label: 'Chờ Phó Hiệu trưởng kiểm tra',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    description: 'Đang đợi Phó Hiệu trưởng phụ trách chuyên môn kiểm tra và phê duyệt',
  },
  need_revision: {
    label: 'Yêu cầu bổ sung',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    description: 'Người kiểm tra yêu cầu chỉnh sửa hoặc bổ sung minh chứng',
  },
  resubmitted: {
    label: 'Đã nộp lại',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    description: 'Giáo viên đã cập nhật phiên bản mới sau khi có yêu cầu bổ sung',
  },
  approved: {
    label: 'Đã phê duyệt',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    description: 'Hồ sơ đã được kiểm tra đạt yêu cầu và phê duyệt chính thức',
  },
  rejected: {
    label: 'Từ chối / Chưa đạt',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    description: 'Hồ sơ không được chấp nhận, cần làm việc trực tiếp với BGH',
  },
};

export const ROLE_LABELS: Record<UserRole, { label: string; badgeClass: string; desc: string }> = {
  admin: {
    label: 'Quản trị viên',
    badgeClass: 'bg-purple-100/90 text-purple-900 border-purple-200/90 shadow-2xs',
    desc: 'Quản trị hệ thống, phân quyền và cấu hình',
  },
  vice_principal: {
    label: 'Phó Hiệu trưởng',
    badgeClass: 'bg-sky-100/90 text-sky-900 border-sky-200/90 shadow-2xs',
    desc: 'Phụ trách chuyên môn 5 khối, phê duyệt và giám sát chung',
  },
  lead: {
    label: 'Tổ trưởng chuyên môn',
    badgeClass: 'bg-teal-100/90 text-teal-900 border-teal-200/90 shadow-2xs',
    desc: 'Quản lý, đôn đốc và kiểm tra hồ sơ trong tổ khối',
  },
  teacher: {
    label: 'Giáo viên',
    badgeClass: 'bg-indigo-100/90 text-indigo-900 border-indigo-200/90 shadow-2xs',
    desc: 'Nộp giáo án, hồ sơ cá nhân và theo dõi nhận xét',
  },
};

export const DEPARTMENT_THEMES: Record<
  string,
  {
    bgBadge: string;
    textBadge: string;
    borderBadge: string;
    cardGradient: string;
    accentColor: string;
    iconBg: string;
    lightBg: string;
  }
> = {
  khoi_1: {
    bgBadge: 'bg-sky-100/80',
    textBadge: 'text-sky-800',
    borderBadge: 'border-sky-200',
    cardGradient: 'from-sky-50/90 via-blue-50/40 to-white',
    accentColor: 'text-sky-600',
    iconBg: 'bg-gradient-to-tr from-sky-400 to-blue-400 text-white',
    lightBg: 'bg-sky-50/70',
  },
  khoi_2: {
    bgBadge: 'bg-purple-100/80',
    textBadge: 'text-purple-800',
    borderBadge: 'border-purple-200',
    cardGradient: 'from-purple-50/90 via-violet-50/40 to-white',
    accentColor: 'text-purple-600',
    iconBg: 'bg-gradient-to-tr from-purple-400 to-violet-400 text-white',
    lightBg: 'bg-purple-50/70',
  },
  khoi_3: {
    bgBadge: 'bg-teal-100/80',
    textBadge: 'text-teal-800',
    borderBadge: 'border-teal-200',
    cardGradient: 'from-teal-50/90 via-emerald-50/40 to-white',
    accentColor: 'text-teal-600',
    iconBg: 'bg-gradient-to-tr from-teal-400 to-emerald-400 text-white',
    lightBg: 'bg-teal-50/70',
  },
  khoi_4: {
    bgBadge: 'bg-amber-100/80',
    textBadge: 'text-amber-800',
    borderBadge: 'border-amber-200',
    cardGradient: 'from-amber-50/90 via-orange-50/40 to-white',
    accentColor: 'text-amber-600',
    iconBg: 'bg-gradient-to-tr from-amber-400 to-orange-400 text-white',
    lightBg: 'bg-amber-50/70',
  },
  khoi_5: {
    bgBadge: 'bg-rose-100/80',
    textBadge: 'text-rose-800',
    borderBadge: 'border-rose-200',
    cardGradient: 'from-rose-50/90 via-pink-50/40 to-white',
    accentColor: 'text-rose-600',
    iconBg: 'bg-gradient-to-tr from-rose-400 to-pink-400 text-white',
    lightBg: 'bg-rose-50/70',
  },
};
