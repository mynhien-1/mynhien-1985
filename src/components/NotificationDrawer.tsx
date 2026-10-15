import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SystemNotification } from '../types';
import { Bell, Check, Clock, AlertTriangle, FileText, CheckCircle2, X } from 'lucide-react';

interface Props {
  userUid: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument?: (docId: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({ userUid, isOpen, onClose, onSelectDocument }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userUid) return;

    const notifRef = collection(db, 'notifications');
    const q = query(notifRef, where('targetUid', '==', userUid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...(d.data() as SystemNotification), id: d.id }));
        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userUid]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.warn('Error marking notification read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.isRead).forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Error marking all read:', e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-purple-100/80 flex items-center justify-between bg-gradient-to-r from-purple-50/80 to-sky-50/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-950 text-sm">Thông báo & Nhắc việc</h3>
            {unreadCount > 0 && (
              <span className="bg-purple-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold shadow-2xs">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-purple-700 hover:text-purple-900 font-medium px-2 py-1 rounded-lg hover:bg-purple-100/60 transition cursor-pointer"
                title="Đánh dấu đã đọc tất cả"
              >
                Đã đọc hết
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-purple-100/60 text-slate-400 hover:text-purple-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-purple-50">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Bạn đã cập nhật hết thông báo</p>
              <p className="text-xs text-slate-400 mt-1">Các thông báo mới về duyệt hồ sơ hoặc nhắc hạn sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) markAsRead(item.id);
                  if (item.linkDocId && onSelectDocument) {
                    onSelectDocument(item.linkDocId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl transition cursor-pointer mb-1.5 ${
                  item.isRead
                    ? 'bg-white/80 hover:bg-purple-50/40 opacity-80 border border-slate-100'
                    : 'bg-gradient-to-r from-purple-50/90 to-sky-50/90 hover:from-purple-100/80 hover:to-sky-100/80 border border-purple-200/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {item.type === 'deadline' ? (
                      <Clock className="w-4 h-4 text-rose-500" />
                    ) : item.type === 'revision' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    ) : item.type === 'approval' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-sky-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${item.isRead ? 'text-slate-700' : 'text-purple-950'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-purple-400 font-medium mt-1 block">
                      {new Date(item.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1 shadow-xs" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
