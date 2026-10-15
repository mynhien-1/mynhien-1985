import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { supabase } from '../supabase';

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadResult {
  fileUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function uploadSchoolDocument(
  file: File,
  departmentId: string,
  userUid: string,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  const timestamp = Date.now();
  // Clean file name
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `documents/${departmentId}/${userUid}/${timestamp}_${sanitizedName}`;

  // 1. First attempt: Supabase Storage (bucket 'documents')
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        if (onProgress) onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
        return {
          fileUrl: urlData.publicUrl,
          storagePath: data.path,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop() || 'unknown',
        };
      }
    }
  } catch (supabaseErr) {
    console.warn('Supabase storage upload attempt skipped or failed, falling back to Firebase Storage:', supabaseErr);
  }

  // 2. Fallback attempt: Firebase Storage
  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        uploadedBy: userUid,
        departmentId,
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) {
            onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
            });
          }
        },
        (error) => {
          console.error('Firebase Storage Upload Error:', error);
          let message = 'Tải tệp lên Cloud Storage thất bại.';
          if (error.code === 'storage/unauthorized') {
            message = 'Lỗi bảo mật Cloud Storage: Bạn không có quyền tải tệp lên vị trí này.';
          } else if (error.code === 'storage/bucket-not-found') {
            message = 'Không tìm thấy Cloud Storage Bucket. Vui lòng kích hoạt Cloud Storage trong Firebase Console hoặc tạo bucket "documents" trong Supabase.';
          } else if (error.code === 'storage/retry-limit-exceeded') {
            message = 'Quá thời gian chờ tải tệp. Vui lòng kiểm tra kết nối mạng.';
          }
          reject(new Error(message));
        },
        async () => {
          try {
            const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              fileUrl,
              storagePath,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type || file.name.split('.').pop() || 'unknown',
            });
          } catch (err) {
            reject(new Error('Không thể lấy đường dẫn tải về từ Cloud Storage.'));
          }
        }
      );
    });
  } catch (err: any) {
    console.error('Initial storage error:', err);
    throw new Error(err?.message || 'Không thể khởi tạo tiến trình tải tệp lên Cloud Storage.');
  }
}
