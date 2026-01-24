
import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import { migrateBlobToR2 } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';
import { ImagePrompt } from '../types';

const MigrationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [images, setImages] = useState<ImagePrompt[]>([]);
    const [status, setStatus] = useState<string>('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const fetchImages = async () => {
            const supabase = getSupabaseClient();
            // Lấy tất cả ảnh, kể cả avatar nếu cần (ở đây ví dụ với bảng images)
            const { data } = await supabase.from('images').select('*');
            if (data) setImages(data);
        };
        fetchImages();
    }, []);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const startMigration = async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            addLog("Lỗi: Bạn không phải Admin.");
            return;
        }

        setStatus('running');
        addLog(`Bắt đầu di chuyển ${images.length} ảnh...`);
        const supabase = getSupabaseClient();
        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            setProgress(Math.round(((i + 1) / images.length) * 100));

            // 1. Kiểm tra xem ảnh đã ở R2 chưa
            if (img.image_url.includes('r2.dev')) {
                skipCount++;
                addLog(`Bỏ qua (đã ở R2): ${img.title}`);
                continue;
            }

            try {
                // 2. Tải ảnh từ Supabase về (dưới dạng Blob)
                addLog(`Đang tải về: ${img.title}...`);
                const response = await fetch(img.image_url);
                if (!response.ok) throw new Error('Không thể tải ảnh gốc');
                const blob = await response.blob();

                // 3. Upload lên R2
                // Giữ nguyên cấu trúc tên file cũ hoặc tạo mới
                const fileExt = blob.type.split('/')[1] || 'jpg';
                const fileName = `${img.user_id}/${Date.now()}_migrated.${fileExt}`;
                
                addLog(`Đang upload lên R2...`);
                const newUrl = await migrateBlobToR2(blob, 'images', fileName);

                // 4. Cập nhật Database
                addLog(`Cập nhật DB...`);
                const { error } = await supabase
                    .from('images')
                    .update({ image_url: newUrl })
                    .eq('id', img.id);

                if (error) throw error;

                successCount++;
                addLog(`✅ Thành công: ${img.title}`);

            } catch (err: any) {
                failCount++;
                addLog(`❌ Thất bại ${img.title}: ${err.message}`);
                console.error(err);
            }
        }

        setStatus('completed');
        addLog(`HOÀN TẤT! Thành công: ${successCount}, Lỗi: ${failCount}, Bỏ qua: ${skipCount}`);
    };

    if (currentUser?.role !== 'admin') return <div className="p-10 text-white">Chỉ dành cho Admin</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 text-cyber-on-surface">
            <h1 className="text-3xl font-bold font-oxanium mb-6 text-cyber-pink">Công cụ chuyển nhà (Migration Tool)</h1>
            
            <div className="bg-cyber-surface/50 p-6 rounded-xl border border-cyber-pink/20">
                <p className="mb-4">
                    Công cụ này sẽ tải từng ảnh từ Supabase Storage và upload sang Cloudflare R2, sau đó cập nhật lại đường dẫn trong Database.
                </p>
                <div className="flex items-center gap-4 mb-6">
                    <div className="text-xl font-bold">Tổng số ảnh: {images.length}</div>
                    {status === 'idle' && (
                        <button 
                            onClick={startMigration}
                            className="px-6 py-2 bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white font-bold rounded-lg hover:shadow-cyber-glow"
                        >
                            Bắt đầu Di chuyển
                        </button>
                    )}
                    {status === 'running' && <div className="text-cyber-cyan animate-pulse">Đang chạy... vui lòng không tắt tab này.</div>}
                    {status === 'completed' && <div className="text-green-500 font-bold">Hoàn tất!</div>}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
                    <div className="bg-cyber-cyan h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Logs */}
                <div className="bg-black/80 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs text-green-400 border border-gray-700">
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MigrationPage;
