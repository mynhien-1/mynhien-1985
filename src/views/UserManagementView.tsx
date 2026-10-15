import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserRole, UserStatus, Department } from '../types';
import { ROLE_LABELS, INITIAL_ADMIN_EMAIL } from '../constants';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  UserCog,
  CheckCircle,
  XCircle,
  Shield,
  Search,
  UserCheck,
  UserX,
  Mail,
  Edit2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  users: UserProfile[];
  departments: Department[];
  onRefresh: () => void;
}

export const UserManagementView: React.FC<Props> = ({ users, departments, onRefresh }) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'disabled'>('all');
  const [search, setSearch] = useState('');

  // Editing user
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('khoi_1');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    if (activeTab === 'pending' && u.status !== 'pending') return false;
    if (activeTab === 'active' && u.status !== 'active') return false;
    if (activeTab === 'disabled' && u.status !== 'disabled') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const startEdit = (u: UserProfile) => {
    setEditingUser(u);
    setSelectedRole(u.role);
    setSelectedDeptId(u.departmentId || departments[0]?.id || 'khoi_1');
    setSelectedStatus(u.status);
    setError(null);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    setError(null);

    const isTargetInitialAdmin = editingUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase();

    // Prevent demoting initial admin
    if (isTargetInitialAdmin && (selectedRole !== 'admin' || selectedStatus !== 'active')) {
      setError('Không thể hạ quyền hoặc vô hiệu hóa tài khoản Quản trị viên gốc.');
      setSaving(false);
      return;
    }

    try {
      const selectedDept = departments.find((d) => d.id === selectedDeptId);
      const userRef = doc(db, 'users', editingUser.uid);

      await updateDoc(userRef, {
        role: selectedRole,
        departmentId: selectedRole === 'admin' || selectedRole === 'vice_principal' ? '' : selectedDeptId,
        departmentName: selectedRole === 'admin' ? 'Ban Giám Hiệu' : selectedRole === 'vice_principal' ? 'Ban Giám Hiệu' : (selectedDept?.name || ''),
        status: selectedStatus,
        updatedAt: new Date().toISOString(),
      });

      // Maintain admins lookup collection
      const adminDocRef = doc(db, 'admins', editingUser.uid);
      if (selectedRole === 'admin') {
        await setDoc(adminDocRef, {
          uid: editingUser.uid,
          email: editingUser.email,
          createdAt: new Date().toISOString(),
        });
      } else if (!isTargetInitialAdmin) {
        try {
          await deleteDoc(adminDocRef);
        } catch (_) {}
      }

      setEditingUser(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message || 'Lỗi khi cập nhật tài khoản người dùng.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Approve action
  const handleQuickApprove = async (u: UserProfile) => {
    try {
      const userRef = doc(db, 'users', u.uid);
      const defaultDept = departments.find((d) => d.id === u.departmentId) || departments[0];
      await updateDoc(userRef, {
        status: 'active',
        departmentId: defaultDept?.id || 'khoi_1',
        departmentName: defaultDept?.name || 'Tổ Khối 1',
        updatedAt: new Date().toISOString(),
      });
      onRefresh();
    } catch (e) {
      console.error('Error approving user:', e);
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 p-5 rounded-2xl border border-purple-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950 tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-purple-600" />
            Quản Lý Tài Khoản & Phân Quyền Bảo Mật
          </h2>
          <p className="text-xs text-purple-600/80 mt-1">
            Phê duyệt tài khoản mới, gán vai trò (Quản trị viên, Phó Hiệu trưởng, Tổ trưởng, Giáo viên) và phân tổ chuyên môn.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <Clock className="w-4 h-4 text-amber-600" />
            Có {pendingCount} tài khoản mới chờ phê duyệt
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-2 border-b sm:border-b-0 border-purple-100 pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả tài khoản', count: users.length },
            { id: 'pending', label: 'Chờ phê duyệt', count: pendingCount, highlight: pendingCount > 0 },
            { id: 'active', label: 'Đang hoạt động', count: users.filter((u) => u.status === 'active').length },
            { id: 'disabled', label: 'Vô hiệu hóa', count: users.filter((u) => u.status === 'disabled').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-sky-400 text-white font-bold shadow-xs shadow-purple-200/50'
                  : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
              } ${tab.highlight ? 'ring-2 ring-amber-400' : ''}`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, tổ khối..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-purple-200/80 bg-white pl-8 pr-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gradient-to-r from-purple-50/70 to-sky-50/70 text-purple-950 font-bold border-b border-purple-100">
              <tr>
                <th className="py-3.5 px-4">Họ và tên / Email</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Tổ Khối phân công</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tham gia</th>
                <th className="py-3.5 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    Không tìm thấy tài khoản nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.teacher;
                  const isSuper = u.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase();

                  return (
                    <tr key={u.uid} className="hover:bg-purple-50/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-purple-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-200 to-sky-200 text-purple-900 flex items-center justify-center font-bold text-xs border border-purple-200">
                              {u.displayName?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{u.displayName}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.email}
                              {isSuper && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold border border-purple-200">
                                  Gốc
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${roleMeta.badgeClass}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                        {u.role === 'admin' || u.role === 'vice_principal'
                          ? 'Toàn trường (BGH)'
                          : u.departmentName || 'Chưa phân tổ'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                            Đã duyệt
                          </span>
                        ) : u.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Vô hiệu hóa
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'pending' && (
                            <button
                              onClick={() => handleQuickApprove(u)}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
                            >
                              Duyệt ngay
                            </button>
                          )}

                          <button
                            onClick={() => startEdit(u)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                            title="Chỉnh sửa vai trò & tổ khối"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <h3 className="font-bold text-purple-950 text-base">
              Phân Quyền: {editingUser.displayName}
            </h3>
            <p className="text-xs text-purple-600/80">{editingUser.email}</p>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gán vai trò người dùng <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-400"
              >
                <option value="teacher">Giáo viên (Nộp hồ sơ, xem nhận xét)</option>
                <option value="lead">Tổ trưởng chuyên môn (Kiểm tra hồ sơ của tổ khối)</option>
                <option value="vice_principal">Phó Hiệu trưởng (Kiểm tra và duyệt cả 5 tổ khối)</option>
                <option value="admin">Quản trị viên (Toàn quyền quản trị hệ thống)</option>
              </select>
            </div>

            {selectedRole !== 'admin' && selectedRole !== 'vice_principal' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tổ Khối phân công <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-400"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái tài khoản <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-400"
              >
                <option value="active">Đã phê duyệt (Đang hoạt động)</option>
                <option value="pending">Chờ phê duyệt</option>
                <option value="disabled">Vô hiệu hóa (Khóa tài khoản)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-purple-50 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveUser}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm shadow-purple-200"
              >
                {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
