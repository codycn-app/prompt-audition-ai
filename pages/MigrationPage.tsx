
import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import { migrateBlobToR2 } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';
import { ImagePrompt } from '../types';
import { InformationCircleIcon } from '../components/icons/InformationCircleIcon';
import { DocumentDuplicateIcon } from '../components/icons/DocumentDuplicateIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { ExclamationTriangleIcon } from '../components/icons/ExclamationTriangleIcon';

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

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            setProgress(Math.round(((i + 1) / images.length) * 100));

            // 1. Kiểm tra xem ảnh đã ở R2 chưa
            if (img.image_url && (img.image_url.includes('r2.dev') || img.image_url.includes('pub-'))) {
                skipCount++;
                addLog(`⏩ Bỏ qua (đã ở R2): ${img.title}`);
                continue;
            }

            try {
                // 2. Tải ảnh từ Supabase về
                addLog(`⬇️ Đang tải về: ${img.title}...`);
                const response = await fetch(img.image_url);
                if (!response.ok) throw new Error(`Không thể tải ảnh gốc (${response.status})`);
                
                const rawBlob = await response.blob();
                
                // CRITICAL FIX: Ensure Content-Type is valid. 
                // Empty Content-Type causes signature mismatches (403 Forbidden).
                let mimeType = rawBlob.type;
                if (!mimeType) {
                    const ext = img.image_url.split('.').pop()?.toLowerCase();
                    if (ext === 'png') mimeType = 'image/png';
                    else if (ext === 'webp') mimeType = 'image/webp';
                    else mimeType = 'image/jpeg';
                }
                // Recreate blob with enforced type
                const blob = rawBlob.type === mimeType ? rawBlob : new Blob([rawBlob], { type: mimeType });

                // 3. Upload lên R2
                const fileExt = mimeType.split('/')[1] || 'jpg';
                const fileName = `${img.user_id}/${Date.now()}_migrated.${fileExt}`;
                
                addLog(`⬆️ Đang upload lên R2...`);
                
                // Calling the migration helper
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
                
                // Enhance error detection
                if (errMsg === 'Failed to fetch' || errMsg.includes('403')) {
                    errMsg = 'Lỗi 403/CORS: Kiểm tra quyền API Token (Read/Write) và CORS.';
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
            
            {/* CORS & Permissions Guide */}
            <div className={`mb-6 border rounded-xl overflow-hidden transition-all duration-300 ${showCorsGuide ? 'bg-cyber-surface border-cyber-pink' : 'bg-cyber-surface/50 border-cyber-pink/20'}`}>
                <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-cyber-surface/80"
                    onClick={() => setShowCorsGuide(!showCorsGuide)}
                >
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
                        <span className="font-semibold text-lg">Gặp lỗi upload (403/CORS)? Đọc ngay!</span>
                    </div>
                    <span className="text-sm text-cyber-cyan">{showCorsGuide ? 'Thu gọn' : 'Xem hướng dẫn khắc phục'}</span>
                </div>
                
                {showCorsGuide && (
                    <div className="p-4 pt-0 border-t border-cyber-pink/20 bg-black/20 text-sm text-cyber-on-surface-secondary">
                        <div className="mb-4 space-y-2">
                            <h3 className="text-white font-bold text-base mt-2">Nguyên nhân phổ biến:</h3>
                            <ul className="list-disc list-inside space-y-1 ml-1">
                                <li>
                                    <strong className="text-red-400">Quan trọng nhất:</strong> API Token R2 của bạn ở Netlify chưa có quyền <strong>Read & Write</strong>. 
                                    (Nếu token là "Read Only", upload sẽ bị chặn với lỗi 403 Forbidden).
                                </li>
                                <li>Chưa cấu hình CORS cho Bucket (lỗi "blocked by CORS policy").</li>
                            </ul>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-3 bg-black/40 rounded border border-gray-700">
                                <h4 className="text-cyber-cyan font-bold mb-2">1. Kiểm tra API Token (Cloudflare)</h4>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Vào Cloudflare R2 Dashboard {'>'} Manage R2 API Tokens.</li>
                                    <li>Tạo token mới (hoặc sửa token cũ).</li>
                                    <li>
                                        <strong>Permissions:</strong> Chọn 
                                        <span className="text-green-400 font-bold"> Admin Read & Write</span>.
                                    </li>
                                    <li>Cập nhật lại biến môi trường (Access Key/Secret Key) trên Netlify.</li>
                                </ol>
                            </div>

                            <div className="p-3 bg-black/40 rounded border border-gray-700">
                                <h4 className="text-cyber-cyan font-bold mb-2">2. Cấu hình CORS (như bạn đã làm)</h4>
                                <div className="relative group mt-1">
                                    <pre className="bg-black p-2 rounded text-[10px] font-mono text-green-400 overflow-x-auto border border-gray-700">
                                        {corsConfig}
                                    </pre>
                                    <button 
                                        onClick={handleCopyCors}
                                        className="absolute top-1 right-1 p-1 bg-cyber-surface rounded hover:border-cyber-cyan text-white"
                                        title="Sao chép JSON"
                                    >
                                        {copiedCors ? <CheckIcon className="w-4 h-4 text-green-500"/> : <DocumentDuplicateIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-cyber-surface/50 p-6 rounded-xl border border-cyber-pink/20 shadow-cyber-glow">
                <p className="mb-4 text-cyber-on-surface-secondary">
                    Công cụ này sẽ tải từng ảnh từ Supabase Storage và upload sang Cloudflare R2.
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
