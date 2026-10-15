import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  SchoolDocument,
  DocumentVersion,
  DocumentComment,
  DocumentStatus,
  SystemNotification,
  ActionType,
  UserRole,
} from '../types';

// Create a new school document record (Draft or Submitted)
export async function createDocumentRecord(
  data: Omit<SchoolDocument, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>,
  initialNote?: string
): Promise<string> {
  const docRef = doc(collection(db, 'documents'));
  const now = new Date().toISOString();

  const newDoc: SchoolDocument = {
    ...data,
    id: docRef.id,
    currentVersion: 1,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, newDoc);

    // Save initial version snapshot into subcollection
    const versionRef = doc(collection(db, 'documents', docRef.id, 'versions'));
    const initialVersion: DocumentVersion = {
      versionNumber: 1,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      storagePath: data.storagePath,
      submittedAt: now,
      submittedByUid: data.ownerUid,
      submittedByName: data.ownerName,
      notes: initialNote || data.notes || 'Nộp lần đầu (Phiên bản v1)',
    };
    await setDoc(versionRef, initialVersion);

    // Record initial action comment
    const commentRef = doc(collection(db, 'documents', docRef.id, 'comments'));
    const initialComment: DocumentComment = {
      authorUid: data.ownerUid,
      authorName: data.ownerName,
      authorRole: 'teacher',
      content: initialNote ? `Nộp hồ sơ: "${data.title}". Ghi chú: ${initialNote}` : `Đã nộp hồ sơ "${data.title}"`,
      actionType: 'submit',
      createdAt: now,
    };
    await setDoc(commentRef, initialComment);

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'documents');
  }
}

// Resubmit a new version of an existing document (retains full history)
export async function resubmitDocumentVersion(
  docId: string,
  existingDoc: SchoolDocument,
  fileData: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    storagePath?: string;
  },
  newStatus: DocumentStatus,
  notes: string,
  user: { uid: string; name: string; role: UserRole }
): Promise<void> {
  const now = new Date().toISOString();
  const nextVersion = (existingDoc.currentVersion || 1) + 1;

  try {
    // 1. Add new version to versions subcollection
    const versionRef = doc(collection(db, 'documents', docId, 'versions'));
    const newVersion: DocumentVersion = {
      versionNumber: nextVersion,
      fileUrl: fileData.fileUrl,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      storagePath: fileData.storagePath,
      submittedAt: now,
      submittedByUid: user.uid,
      submittedByName: user.name,
      notes: notes || `Nộp lại phiên bản v${nextVersion}`,
    };
    await setDoc(versionRef, newVersion);

    // 2. Add audit comment
    const commentRef = doc(collection(db, 'documents', docId, 'comments'));
    const comment: DocumentComment = {
      authorUid: user.uid,
      authorName: user.name,
      authorRole: user.role,
      content: `Đã nộp lại phiên bản v${nextVersion}. ${notes ? `Nội dung cập nhật: ${notes}` : ''}`,
      actionType: 'resubmit',
      createdAt: now,
    };
    await setDoc(commentRef, comment);

    // 3. Update parent document
    const docRef = doc(db, 'documents', docId);
    await updateDoc(docRef, {
      fileUrl: fileData.fileUrl,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      storagePath: fileData.storagePath || '',
      currentVersion: nextVersion,
      status: newStatus,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `documents/${docId}`);
  }
}

// Review a document (Approve, Request Revision, Reject, or Forward)
export async function reviewDocument(
  docId: string,
  reviewer: { uid: string; name: string; role: UserRole },
  action: ActionType,
  newStatus: DocumentStatus,
  feedback: string,
  rejectionReason?: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const docRef = doc(db, 'documents', docId);

    const updatePayload: Partial<SchoolDocument> = {
      status: newStatus,
      reviewedByUid: reviewer.uid,
      reviewedByName: reviewer.name,
      reviewedAt: now,
      reviewNotes: feedback,
      rejectionReason: rejectionReason || '',
      updatedAt: now,
    };

    await updateDoc(docRef, updatePayload);

    // Add audit comment
    const commentRef = doc(collection(db, 'documents', docId, 'comments'));
    const comment: DocumentComment = {
      authorUid: reviewer.uid,
      authorName: reviewer.name,
      authorRole: reviewer.role,
      content: feedback || (action === 'approve' ? 'Đã phê duyệt hồ sơ đạt yêu cầu.' : 'Đã xử lý hồ sơ.'),
      actionType: action,
      createdAt: now,
    };
    await setDoc(commentRef, comment);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `documents/${docId}`);
  }
}

// Add a general comment to a document
export async function addDocumentComment(
  docId: string,
  author: { uid: string; name: string; role: UserRole },
  content: string,
  actionType: ActionType = 'comment'
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const commentRef = doc(collection(db, 'documents', docId, 'comments'));
    const comment: DocumentComment = {
      authorUid: author.uid,
      authorName: author.name,
      authorRole: author.role,
      content,
      actionType,
      createdAt: now,
    };
    await setDoc(commentRef, comment);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `documents/${docId}/comments`);
  }
}

// Fetch all historical versions for a document
export async function getDocumentVersions(docId: string): Promise<DocumentVersion[]> {
  try {
    const versionsRef = collection(db, 'documents', docId, 'versions');
    const q = query(versionsRef, orderBy('versionNumber', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as DocumentVersion);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `documents/${docId}/versions`);
  }
}

// Fetch all comments and audit entries for a document
export async function getDocumentComments(docId: string): Promise<DocumentComment[]> {
  try {
    const commentsRef = collection(db, 'documents', docId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentComment) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `documents/${docId}/comments`);
  }
}

// Delete draft document
export async function deleteDraftDocument(docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'documents', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${docId}`);
  }
}

// Send in-app notification
export async function createNotification(
  targetUid: string,
  title: string,
  message: string,
  type: SystemNotification['type'],
  linkDocId?: string
): Promise<void> {
  try {
    const notifRef = doc(collection(db, 'notifications'));
    const notification: SystemNotification = {
      id: notifRef.id,
      targetUid,
      title,
      message,
      type,
      linkDocId: linkDocId || '',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    await setDoc(notifRef, notification);
  } catch (error) {
    console.warn('Notification creation silent error:', error);
  }
}
