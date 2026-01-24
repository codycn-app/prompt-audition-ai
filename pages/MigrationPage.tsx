
import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import { migrateBlobToR2 } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';
import { ImagePrompt } from '../types';
import { InformationCircleIcon } from '../components/icons/InformationCircleIcon';
import { DocumentDuplicateIcon } from '../components/icons/DocumentDuplicateIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

const MigrationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [images, setImages] = useState<ImagePrompt[]>([]);
    const [status, setStatus] = useState<string>('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [showCorsGuide, setShowCorsGuide] = useState(false);
    const [copiedCors, setCopiedCors] = useState(false);

    const corsConfig = `[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT", "GET", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]`;

    useEffect(() => {
        const fetchImages = async () => {
            const supabase = getSupabaseClient();
            const { data } = await supabase.from('images').select('*');
            if (data) setImages(data);
        };
        fetchImages();
    }, []);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleCopyCors = () => {
        navigator.clipboard.writeText(corsConfig);
        setCopiedCors(true);
        setTimeout(() => setCopiedCors(false), 2000);
    };

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

        // Use a for...of loop or standard for loop to handle async properly
        // Note: Processing one by one to avoid overwhelming the browser/network
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            setProgress(Math.round(((i + 1) / images.length) * 100));

            // 1. Kiểm tra xem ảnh đã ở R2 chưa (Check domain R2)
            // Cập nhật logic: Nếu URL chứa r2.dev HOẶC chứa domain custom của R2 (nếu có sau này)
            if (img.image_url && (img.image_url.includes('r2.dev') || img.image_url.includes('pub-'))) {
                skipCount++;
                addLog(`⏩ Bỏ qua (đã ở R2): ${img.title}`);
                continue;
            }

            try {
                // 2. Tải ảnh từ Supabase về (dưới dạng Blob)
                addLog(`⬇️ Đang tải về: ${img.title}...`);
                const response = await fetch(img.image_url);
                if (!response.ok) throw new Error(`Không thể tải ảnh gốc (${response.status})`);
                const blob = await response.blob();

                // 3. Upload lên R2
                const fileExt = blob.type.split('/')[1] || 'jpg';
                const fileName = `${img.user_id}/${Date.now()}_migrated.${fileExt}`;
                
                addLog(`⬆️ Đang upload lên R2...`);
                // Upload sẽ dùng PUT request trực tiếp từ trình duyệt lên R2
                // Nếu R2 chưa cấu hình CORS, bước này sẽ lỗi "Failed to fetch"
                const newUrl = await migrateBlobToR2(blob, 'images', fileName);

                // 4. Cập nhật Database
                addLog(`💾 Cập nhật DB...`);
                const { error } = await supabase
                    .from('images')
                    .update({ image_url: newUrl })
                    .eq('id', img.id);

                if (error) throw error;

                successCount++;
                addLog(`✅ Thành công: ${img.title}`);

            } catch (err: any) {
                failCount++;
                let errMsg = err.message;
                if (errMsg === 'Failed to fetch') {
                    errMsg = 'Lỗi kết nối hoặc CORS (Xem hướng dẫn bên trên)';
                    // Auto open guide if CORS error suspected
                    if (!showCorsGuide) setShowCorsGuide(true);
                }
                addLog(`❌ Thất bại [${img.title}]: ${errMsg}`);
                console.error(err);
            }
        }

        setStatus('completed');
        addLog(`🏁 HOÀN TẤT! Thành công: ${successCount}, Lỗi: ${failCount}, Bỏ qua: ${skipCount}`);
    };

    if (currentUser?.role !== 'admin') return <div className="p-10 text-center text-cyber-on-surface">Chỉ dành cho Admin</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 text-cyber-on-surface animate-fade-in-scale">
            <h1 className="text-3xl font-bold font-oxanium mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyber-pink to-cyber-cyan">
                Công cụ chuyển nhà (Migration Tool)
            </h1>
            
            {/* CORS Warning / Guide */}
            <div className={`mb-6 border rounded-xl overflow-hidden transition-all duration-300 ${showCorsGuide ? 'bg-cyber-surface border-cyber-pink' : 'bg-cyber-surface/50 border-cyber-pink/20'}`}>
                <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-cyber-surface/80"
                    onClick={() => setShowCorsGuide(!showCorsGuide)}
                >
                    <div className="flex items-center gap-2">
                        <InformationCircleIcon className="w-6 h-6 text-cyber-cyan" />
                        <span className="font-semibold text-lg">Cấu hình CORS (Bắt buộc trước khi chạy)</span>
                    </div>
                    <span className="text-sm text-cyber-cyan">{showCorsGuide ? 'Thu gọn' : 'Xem hướng dẫn'}</span>
                </div>
                
                {showCorsGuide && (
                    <div className="p-4 pt-0 border-t border-cyber-pink/20 bg-black/20">
                        <p className="mt-3 text-sm text-cyber-on-surface-secondary mb-3">
                            Lỗi <strong>"Failed to fetch"</strong> hoặc <strong>"CORS policy"</strong> xảy ra do Cloudflare R2 mặc định chặn trình duyệt upload file. 
                            Bạn cần thêm cấu hình sau vào R2 Bucket:
                        </p>
                        <ol className="list-decimal list-inside text-sm text-cyber-on-surface-secondary mb-4 space-y-1">
                            <li>Truy cập <strong>Cloudflare Dashboard</strong> &gt; <strong>R2</strong>.</li>
                            <li>Chọn Bucket <strong>audition-ai-images</strong>.</li>
                            <li>Vào tab <strong>Settings</strong>, kéo xuống phần <strong>CORS Policy</strong>.</li>
                            <li>Bấm <strong>Edit CORS Policy</strong> và dán đoạn mã sau:</li>
                        </ol>
                        <div className="relative group">
                            <pre className="bg-black p-4 rounded-lg text-xs sm:text-sm font-mono text-green-400 overflow-x-auto border border-gray-700">
                                {corsConfig}
                            </pre>
                            <button 
                                onClick={handleCopyCors}
                                className="absolute top-2 right-2 p-2 bg-cyber-surface rounded-md border border-gray-600 hover:border-cyber-cyan text-white transition-all"
                                title="Sao chép"
                            >
                                {copiedCors ? <CheckIcon className="w-5 h-5 text-green-500"/> : <DocumentDuplicateIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-cyber-surface/50 p-6 rounded-xl border border-cyber-pink/20 shadow-cyber-glow">
                <p className="mb-4 text-cyber-on-surface-secondary">
                    Công cụ này sẽ tải từng ảnh từ Supabase Storage và upload sang Cloudflare R2, sau đó cập nhật lại đường dẫn trong Database.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <div className="text-xl font-bold bg-black/40 px-4 py-2 rounded-lg border border-gray-700">
                        Tổng số: <span className="text-cyber-pink">{images.length}</span>
                    </div>
                    
                    <div className="flex-grow"></div>

                    {status === 'idle' && (
                        <button 
                            onClick={startMigration}
                            className="px-8 py-3 bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white font-bold rounded-lg hover:shadow-cyber-glow transform active:scale-95 transition-all"
                        >
                            Bắt đầu Di chuyển
                        </button>
                    )}
                    {status === 'running' && (
                        <div className="flex items-center gap-3 px-6 py-2 bg-black/40 rounded-lg border border-cyber-cyan/30">
                            <div className="w-5 h-5 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-cyber-cyan font-semibold animate-pulse">Đang xử lý... đừng tắt tab này!</span>
                        </div>
                    )}
                    {status === 'completed' && <div className="text-green-500 font-bold text-xl flex items-center gap-2"><CheckIcon className="w-8 h-8"/> Hoàn tất!</div>}
                </div>

                {/* Progress Bar */}
                <div className="relative w-full bg-black/50 rounded-full h-6 mb-6 overflow-hidden border border-gray-700">
                    <div 
                        className="bg-gradient-to-r from-cyber-pink to-cyber-cyan h-full transition-all duration-300 ease-out flex items-center justify-center" 
                        style={{ width: `${progress}%` }}
                    >
                        {progress > 5 && <span className="text-[10px] font-bold text-white drop-shadow-md">{progress}%</span>}
                    </div>
                </div>

                {/* Logs */}
                <div className="bg-black/80 p-4 rounded-lg h-80 overflow-y-auto font-mono text-xs text-green-400 border border-gray-700 custom-scrollbar shadow-inner">
                    {logs.length === 0 ? (
                        <span className="text-gray-500 italic">Nhật ký xử lý sẽ hiện tại đây...</span>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="border-b border-gray-800/50 pb-1 mb-1 last:border-0">{log}</div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MigrationPage;
