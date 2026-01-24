
import { getSupabaseClient } from '../supabaseClient';

// CẤU HÌNH: Thay đổi các biến này sau khi bạn đã thiết lập R2
// Nếu R2_PUBLIC_DOMAIN rỗng, app sẽ fallback về dùng Supabase Storage mặc định.
const R2_PUBLIC_DOMAIN = ''; // Ví dụ: 'https://pub-xxxxxxxx.r2.dev'
const R2_BUCKET_NAME = 'audition-images'; // Tên bucket trên R2

export const uploadFile = async (
    file: File, 
    folder: 'images' | 'avatars', 
    fileName: string
): Promise<string> => {
    const supabase = getSupabaseClient();

    // 1. Chế độ R2 (Ưu tiên nếu đã cấu hình)
    if (R2_PUBLIC_DOMAIN) {
        const fullPath = `${folder}/${fileName}`;
        
        // Gọi Edge Function để lấy Presigned URL
        const { data, error } = await supabase.functions.invoke('storage-service', {
            body: { 
                action: 'upload',
                bucket: R2_BUCKET_NAME,
                key: fullPath,
                contentType: file.type
            }
        });

        if (error || !data?.signedUrl) {
            console.error("Edge Function Error:", error);
            throw new Error("Không thể kết nối tới máy chủ lưu trữ R2 (Edge Function).");
        }

        // Upload trực tiếp lên R2 bằng PUT
        const uploadResponse = await fetch(data.signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });

        if (!uploadResponse.ok) {
            throw new Error("Lỗi khi tải file lên Cloudflare R2.");
        }

        // Trả về Public URL
        return `${R2_PUBLIC_DOMAIN}/${fullPath}`;
    }

    // 2. Chế độ Supabase Storage (Fallback cũ)
    // Upload directly to Supabase Storage buckets
    const bucketName = folder === 'avatars' ? 'avatars' : 'images';
    // Remove folder prefix from fileName if present to avoid double folders in Supabase logic if strictly followed,
    // but usually fileName passed here is 'userId/timestamp.ext'.
    
    const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    
    // Cache busting timestamp
    return `${urlData.publicUrl}?t=${new Date().getTime()}`;
};

export const deleteFile = async (imageUrl: string): Promise<void> => {
    const supabase = getSupabaseClient();

    // Kiểm tra xem ảnh thuộc R2 hay Supabase
    if (R2_PUBLIC_DOMAIN && imageUrl.startsWith(R2_PUBLIC_DOMAIN)) {
        // Logic xóa trên R2
        const key = imageUrl.replace(`${R2_PUBLIC_DOMAIN}/`, '');
        const { error } = await supabase.functions.invoke('storage-service', {
            body: {
                action: 'delete',
                bucket: R2_BUCKET_NAME,
                key: key
            }
        });
        if (error) console.error("R2 Delete Error:", error);
        return;
    }

    // Logic xóa trên Supabase
    // Cố gắng trích xuất đường dẫn từ URL Supabase
    try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/storage/v1/object/public/');
        if (pathParts.length > 1) {
            const fullPath = pathParts[1]; // e.g., "images/userid/file.jpg"
            const [bucket, ...rest] = fullPath.split('/');
            const filePath = rest.join('/');
            
            if (bucket && filePath) {
                await supabase.storage.from(bucket).remove([filePath]);
            }
        }
    } catch (e) {
        console.warn("Không thể phân tích URL để xóa file:", imageUrl);
    }
};
