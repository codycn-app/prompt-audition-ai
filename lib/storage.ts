
import { getSupabaseClient } from '../supabaseClient';

// CẤU HÌNH R2 (Đã cập nhật theo ảnh bạn gửi)
const R2_PUBLIC_DOMAIN = 'https://pub-7a59a184512144158a3ce246c7165fee.r2.dev';
const R2_BUCKET_NAME = 'audition-ai-images'; 

// Hàm gọi Netlify Function thay vì Supabase Function
const invokeNetlifyStorage = async (body: any) => {
    try {
        const response = await fetch('/.netlify/functions/storage-service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Netlify Function Error: ${response.status} - ${errText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Storage Service Error:", error);
        throw error;
    }
};

export const uploadFile = async (
    file: File, 
    folder: 'images' | 'avatars', 
    fileName: string
): Promise<string> => {
    // 1. Chế độ R2 (Luôn bật vì đã cấu hình)
    if (R2_PUBLIC_DOMAIN) {
        const fullPath = `${folder}/${fileName}`;
        
        // Gọi Netlify Function để lấy Presigned URL
        const data = await invokeNetlifyStorage({ 
            action: 'upload',
            bucket: R2_BUCKET_NAME,
            key: fullPath,
            contentType: file.type,
            cacheControl: 'public, max-age=31536000, immutable'
        });

        if (!data?.signedUrl) {
            throw new Error("Không lấy được link upload từ R2.");
        }

        // Upload trực tiếp lên R2 bằng PUT
        const uploadResponse = await fetch(data.signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });

        if (!uploadResponse.ok) {
            throw new Error("Lỗi khi đẩy file lên Cloudflare R2.");
        }

        // Trả về Public URL
        return `${R2_PUBLIC_DOMAIN}/${fullPath}`;
    }

    return ''; // Should not happen given config
};

export const deleteFile = async (imageUrl: string): Promise<void> => {
    const supabase = getSupabaseClient();

    // 1. Nếu là ảnh trên R2
    if (R2_PUBLIC_DOMAIN && imageUrl.startsWith(R2_PUBLIC_DOMAIN)) {
        const key = imageUrl.replace(`${R2_PUBLIC_DOMAIN}/`, '');
        await invokeNetlifyStorage({
            action: 'delete',
            bucket: R2_BUCKET_NAME,
            key: key
        });
        return;
    }

    // 2. Nếu là ảnh cũ trên Supabase (Fallback để xóa ảnh cũ)
    try {
        if (imageUrl.includes('supabase.co') || imageUrl.includes('/storage/v1/object/public/')) {
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/storage/v1/object/public/');
            if (pathParts.length > 1) {
                const fullPath = pathParts[1];
                const [bucket, ...rest] = fullPath.split('/');
                const filePath = rest.join('/');
                
                if (bucket && filePath) {
                    await supabase.storage.from(bucket).remove([filePath]);
                }
            }
        }
    } catch (e) {
        console.warn("Không thể xóa file cũ trên Supabase:", imageUrl);
    }
};

// Hàm hỗ trợ cho Migration: Upload Blob trực tiếp lên R2
export const migrateBlobToR2 = async (blob: Blob, folder: string, fileName: string): Promise<string> => {
    const fullPath = `${folder}/${fileName}`;
    const data = await invokeNetlifyStorage({ 
        action: 'upload',
        bucket: R2_BUCKET_NAME,
        key: fullPath,
        contentType: blob.type,
        cacheControl: 'public, max-age=31536000, immutable'
    });

    if (!data?.signedUrl) {
        throw new Error('Không lấy được link upload từ R2.');
    }

    const uploadResponse = await fetch(data.signedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': blob.type, 'Cache-Control': 'public, max-age=31536000, immutable' }
    });

    if (!uploadResponse.ok) {
        throw new Error(`Upload R2 thất bại (${uploadResponse.status}).`);
    }

    return `${R2_PUBLIC_DOMAIN}/${fullPath}`;
}

export const createThumbnailWebP = async (file: Blob, crop?: { x: number; y: number; width: number; height: number } | null): Promise<Blob> => {
    const bitmap = await createImageBitmap(file);
    const source = crop && crop.width > 0 && crop.height > 0 ? crop : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
    const scale = Math.min(1, 640 / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Không thể tạo thumbnail.');
    context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Không thể mã hóa WebP.')), 'image/webp', 0.82));
};

export const uploadImageWithThumbnail = async (file: File, folder: 'images' | 'avatars', fileName: string, crop?: { x: number; y: number; width: number; height: number } | null) => {
    const imageUrl = await uploadFile(file, folder, fileName);
    const thumbnail = await createThumbnailWebP(file, crop);
    const thumbnailUrl = await migrateBlobToR2(thumbnail, folder, `${fileName.replace(/\.[^.]+$/, '')}.webp`);
    return { imageUrl, thumbnailUrl };
};
