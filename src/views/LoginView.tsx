import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { School, ShieldCheck, CheckCircle2, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { INITIAL_ADMIN_EMAIL } from '../constants';

export const LoginView: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Đăng nhập bằng Google không thành công. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100/70 via-sky-50/70 to-indigo-100/60 flex flex-col justify-between text-slate-800 selection:bg-purple-200 selection:text-purple-900">
      {/* Top Navbar */}
      <header className="border-b border-purple-100/80 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-400 via-indigo-400 to-sky-400 flex items-center justify-center text-white shadow-xs">
            <School className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-purple-950 tracking-tight">
              HỒ SƠ CHUYÊN MÔN SỐ
            </h1>
            <p className="text-[11px] text-sky-600 font-semibold">Trường Tiểu Học Ba Chúc • 5 Khối Lớp</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50/90 px-3 py-1.5 rounded-full border border-purple-200/80 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Hệ thống quản lý nội bộ
          </span>
        </div>
      </header>

      {/* Hero / Login Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Col: Introduction */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Chuyển đổi số công tác quản lý chuyên môn
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-purple-950 leading-tight">
            Số Hóa Hồ Sơ & Giáo Án
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-sky-500">
              Trường Tiểu Học Ba Chúc
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Hệ thống hỗ trợ Ban Giám Hiệu và Tổ trưởng chuyên môn theo dõi, tiếp nhận, nhận xét và phê duyệt giáo án, kế hoạch bài dạy của 5 khối lớp. Hạn chế tối đa hồ sơ in ấn trên giấy, lưu trữ phiên bản an toàn và bảo mật phân quyền đa tầng.
          </p>

          {/* 4 Feature Highlights - each area with soft pastel tint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 space-y-1 shadow-2xs">
              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                Quản lý 5 Tổ Khối
              </span>
              <p className="text-slate-600">
                Phân vùng hồ sơ theo Khối 1, Khối 2, Khối 3, Khối 4, Khối 5; Tổ trưởng chỉ quản lý tổ mình.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-1 shadow-2xs">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                Lưu vết phiên bản
              </span>
              <p className="text-slate-600">
                Lưu giữ lịch sử từng lần nộp lại (v1, v2...), ngày nộp và toàn bộ ý kiến nhận xét của người kiểm tra.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-100 space-y-1 shadow-2xs">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                Quy trình linh hoạt
              </span>
              <p className="text-slate-600">
                Hỗ trợ duyệt trực tiếp bởi Phó Hiệu trưởng hoặc qua Tổ trưởng rà soát trước khi chuyển BGH.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-100 space-y-1 shadow-2xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                Báo cáo & Nhắc hạn
              </span>
              <p className="text-slate-600">
                Cảnh báo hồ sơ quá hạn, theo dõi tiến độ từng giáo viên và xuất báo cáo Excel chuẩn xác.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Sign In Card */}
        <div className="lg:col-span-5">
          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xl shadow-purple-100/50 space-y-6">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-gradient-to-tr from-purple-100 to-sky-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-purple-200/80 shadow-2xs">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-purple-950">Đăng Nhập Hệ Thống</h3>
              <p className="text-xs text-slate-500">
                Dành cho Ban Giám Hiệu, Tổ trưởng chuyên môn và Giáo viên nhà trường
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-purple-50/80 text-slate-800 font-bold text-sm border border-purple-200/90 shadow-sm transition transform active:scale-98 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
            </button>

            {/* Note on approval policy */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/70 to-sky-50/70 border border-purple-100 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-purple-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                Chính sách an toàn & kiểm soát:
              </div>
              <p>
                - Tài khoản mới đăng nhập sẽ ở trạng thái <strong className="text-amber-700">Chờ duyệt</strong> và cần Quản trị viên phân công Tổ khối trước khi truy cập hồ sơ.
              </p>
              <p>
                - Quản trị viên khởi tạo: <span className="text-purple-900 font-mono font-semibold">{INITIAL_ADMIN_EMAIL}</span>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100/80 py-4 px-6 text-center text-xs text-purple-600/80">
        Hệ Thống Quản Lý Hồ Sơ Chuyên Môn Số – Trường Tiểu Học Ba Chúc • 5 Tổ Khối Chuyên Môn
      </footer>
    </div>
  );
};
