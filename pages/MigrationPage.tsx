
import React, { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import { migrateBlobToR2 } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';
import { ImagePrompt } from '../types';
import { InformationCircleIcon } from '../components/icons/InformationCircleIcon';
import { DocumentDuplicateIcon } from '../components/icons/DocumentDuplicateIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { ExclamationTriangleIcon } from '../components/icons/ExclamationTriangleIcon';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';

const MigrationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [images, setImages] = useState<ImagePrompt[]>([]);
    const [status, setStatus] = useState<string>('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [showGuides, setShowGuides] = useState(false);
    const [copiedCors, setCopiedCors] = useState(false);
    const [copiedSQL, setCopiedSQL] = useState(false);
    const [copiedRLS, setCopiedRLS] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'r2' | 'supabase' | 'rls'>('rls');

    const corsConfig = `[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT", "GET", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]`;

    const sqlConfig = `DO $$
BEGIN
    UPDATE storage.buckets SET public = true WHERE name = 'images';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'cors') THEN
        EXECUTE 'UPDATE storage.buckets SET cors = ''[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"], "responseHeader": ["*"], "maxAgeSeconds": 3600}]''::json WHERE name = ''images'';';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'allowed_origins') THEN
        EXECUTE 'UPDATE storage.buckets SET allowed_origins = ARRAY[''*''] WHERE name = ''images'';';
    END IF;
END $$;`;

    // SQL to disable RLS temporarily
    const sqlRLS = `ALTER TABLE images DISABLE ROW LEVEL SECURITY;`;

    const fetchImages = async () => {
        setIsRefreshing(true);
        const supabase = getSupabaseClient();
        const { data } = await supabase.from('images').select('*');
        if (data) setImages(data);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const stats = useMemo(() => {
        const total = images.length;
        const onR2 = images.filter(img => img.image_url && (img.image_url.includes('r2.dev') || img.image_url.includes('pub-'))).length;
        const onSupabase = total - onR2;
        return { total, onR2, onSupabase };
    }, [images]);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleCopyCors = () => {
        navigator.clipboard.writeText(corsConfig);
        setCopiedCors(true);
        setTimeout(() => setCopiedCors(false), 2000);
    };

    const handleCopySQL = () => {
        navigator.clipboard.writeText(sqlConfig);
        setCopiedSQL(true);
        setTimeout(() => setCopiedSQL(false), 2000);
    };

    const handleCopyRLS = () => {
        navigator.clipboard.writeText(sqlRLS);
        setCopiedRLS(true);
        setTimeout(() => setCopiedRLS(false), 2000);
    };

    const startMigration = async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            addLog("Lỗi: Bạn không phải Admin.");
            return;
        }

        setStatus('running');
        addLog(`Bắt đầu di chuyển ${stats.onSupabase} ảnh còn lại...`);
        const supabase = getSupabaseClient();
        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const currentPercent = Math.round(((i + 1) / images.length) * 100);
            if (currentPercent > progress) setProgress(currentPercent);

            if (img.image_url && (img.image_url.includes('r2.dev') || img.image_url.includes('pub-'))) {
                skipCount++;
                if (i < 5) addLog(`⏩ Bỏ qua (đã ở R2): ${img.title}`);
                continue;
            }

            try {
                addLog(`⬇️ Đang tải về [${i + 1}/${images.length}]: ${img.title}...`);
                
                let response;
                try {
                    response = await fetch(img.image_url);
                } catch (fetchErr) {
                     throw new Error('Lỗi tải từ Supabase (CORS?). Xem hướng dẫn tab "Supabase Source".');
                }

                if (!response.ok) throw new Error(`Không thể tải ảnh gốc (${response.status})`);
                
                const rawBlob = await response.blob();
                
                let mimeType = rawBlob.type;
                if (!mimeType) {
                    const ext = img.image_url.split('.').pop()?.toLowerCase();
                    if (ext === 'png') mimeType = 'image/png';
                    else if (ext === 'webp') mimeType = 'image/webp';
                    else mimeType = 'image/jpeg';
                }
                const blob = rawBlob.type === mimeType ? rawBlob : new Blob([rawBlob], { type: mimeType });

                const fileExt = mimeType.split('/')[1] || 'jpg';
                const fileName = `${img.user_id}/${Date.now()}_migrated.${fileExt}`;
                
                addLog(`⬆️ Đang upload lên R2...`);
                
                try {
                    const newUrl = await migrateBlobToR2(blob, 'images', fileName);

                    // 4. Cập nhật Database
                    addLog(`💾 Cập nhật DB...`);
                    
                    // CRITICAL FIX: Use select() to verify if the row was actually updated.
                    const { data: updatedRows, error } = await supabase
                        .from('images')
                        .update({ image_url: newUrl })
                        .eq('id', img.id)
                        .select();

                    if (error) throw error;
                    
                    // IF NO ROWS UPDATED -> RLS BLOCKED IT
                    if (!updatedRows || updatedRows.length === 0) {
                        throw new Error('Lỗi Quyền (RLS): Không thể cập nhật DB. Xem hướng dẫn "Lỗi Quyền DB".');
                    }

                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, image_url: newUrl } : p));

                    successCount++;
                    addLog(`✅ Thành công: URL đã thay đổi.`);
                    
                } catch (uploadErr: any) {
                    let msg = uploadErr.message;
                    if (msg.includes('403') || msg.includes('Failed to fetch')) {
                        msg = 'Lỗi Upload R2 (CORS/Quyền). Xem hướng dẫn tab "Cloudflare R2".';
                        if (!showGuides) setShowGuides(true);
                        setActiveTab('r2');
                    }
                    // Handle RLS specific error
                    if (msg.includes('Lỗi Quyền (RLS)')) {
                         if (!showGuides) setShowGuides(true);
                         setActiveTab('rls');
                    }
                    throw new Error(msg);
                }

                await new Promise(r => setTimeout(r, 200));

            } catch (err: any) {
                failCount++;
                let errMsg = err.message;
                
                if (errMsg.includes('Lỗi tải từ Supabase')) {
                    if (!showGuides) setShowGuides(true);
                    setActiveTab('supabase');
                }

                addLog(`❌ Thất bại [${img.title}]: ${errMsg}`);
                console.error(err);
            }
        }

        setStatus('completed');
        addLog(`🏁 HOÀN TẤT! Đã chuyển: ${successCount}, Lỗi: ${failCount}, Đã ở R2 từ trước: ${skipCount}`);
        await fetchImages();
    };

    if (currentUser?.role !== 'admin') return <div className="p-10 text-center text-cyber-on-surface">Chỉ dành cho Admin</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 text-cyber-on-surface animate-fade-in-scale">
            <h1 className="text-3xl font-bold font-oxanium mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyber-pink to-cyber-cyan">
                Công cụ chuyển nhà (Migration Tool)
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-cyber-surface border border-cyber-pink/20 flex flex-col items-center justify-center">
                    <span className="text-cyber-on-surface-secondary text-sm uppercase font-bold">Tổng số ảnh</span>
                    <span className="text-3xl font-oxanium font-bold text-white mt-1">{stats.total}</span>
                </div>
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/30 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-green-500/5 z-0"></div>
                    <span className="text-green-400 text-sm uppercase font-bold z-10">Đã ở Cloudflare R2</span>
                    <span className="text-3xl font-oxanium font-bold text-green-400 mt-1 z-10">{stats.onR2}</span>
                    <span className="text-xs text-green-300/70 z-10 mt-1">{Math.round((stats.onR2 / (stats.total || 1)) * 100)}%</span>
                </div>
                <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/30 flex flex-col items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-yellow-500/5 z-0"></div>
                    <span className="text-yellow-400 text-sm uppercase font-bold z-10">Còn ở Supabase</span>
                    <span className="text-3xl font-oxanium font-bold text-yellow-400 mt-1 z-10">{stats.onSupabase}</span>
                    {stats.onSupabase === 0 && stats.total > 0 && (
                        <span className="text-xs font-bold text-green-400 z-10 mt-1 flex items-center gap-1">
                            <CheckIcon className="w-3 h-3"/> An toàn để xóa Bucket
                        </span>
                    )}
                </div>
            </div>

            <div className={`mb-6 border rounded-xl overflow-hidden transition-all duration-300 ${showGuides ? 'bg-cyber-surface border-cyber-pink' : 'bg-cyber-surface/50 border-cyber-pink/20'}`}>
                <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-cyber-surface/80"
                    onClick={() => setShowGuides(!showGuides)}
                >
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
                        <span className="font-semibold text-lg">Trung tâm khắc phục lỗi</span>
                    </div>
                    <span className="text-sm text-cyber-cyan">{showGuides ? 'Thu gọn' : 'Xem hướng dẫn'}</span>
                </div>
                
                {showGuides && (
                    <div className="p-4 pt-0 border-t border-cyber-pink/20 bg-black/20 text-sm text-cyber-on-surface-secondary">
                        <div className="flex border-b border-gray-700 mb-4 mt-2 overflow-x-auto">
                             <button 
                                className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'rls' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setActiveTab('rls')}
                             >
                                3. Lỗi Quyền DB (QUAN TRỌNG)
                             </button>
                             <button 
                                className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'supabase' ? 'text-cyber-pink border-b-2 border-cyber-pink' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setActiveTab('supabase')}
                             >
                                1. Lỗi Download (Supabase CORS)
                             </button>
                             <button 
                                className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'r2' ? 'text-cyber-pink border-b-2 border-cyber-pink' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setActiveTab('r2')}
                             >
                                2. Lỗi Upload (Cloudflare CORS)
                             </button>
                        </div>

                         {activeTab === 'rls' && (
                            <div className="animate-fade-in-scale">
                                <p className="mb-2 text-red-300 font-bold">
                                    Đây là lý do bạn thấy "Success" nhưng ảnh vẫn còn ở Supabase!
                                </p>
                                <p className="mb-2">
                                    Supabase chặn bạn sửa dữ liệu của người khác (Row Level Security). Để công cụ này hoạt động triệt để, bạn cần chạy lệnh SQL sau để tắt kiểm soát quyền tạm thời.
                                </p>
                                <ol className="list-decimal list-inside space-y-1 ml-1 mb-3">
                                    <li>Vào Supabase Dashboard {'>'} <strong>SQL Editor</strong>.</li>
                                    <li>Dán lệnh bên dưới và bấm <strong>Run</strong>.</li>
                                    <li>Sau khi Migration hoàn tất 100%, bạn có thể bật lại RLS nếu muốn.</li>
                                </ol>
                                <div className="relative group mt-2">
                                    <pre className="bg-black p-3 rounded text-xs font-mono text-red-300 overflow-x-auto border border-red-500/30">
{sqlRLS}
                                    </pre>
                                    <button 
                                        onClick={handleCopyRLS} 
                                        className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded hover:bg-gray-700 text-white flex items-center gap-1 text-xs" 
                                        title="Sao chép SQL"
                                    >
                                        {copiedRLS ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ShieldCheckIcon className="w-4 h-4"/>}
                                        {copiedRLS ? 'Đã chép' : 'Copy SQL'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'r2' && (
                            <div className="animate-fade-in-scale">
                                <p className="mb-2">Nếu lỗi xảy ra khi <strong>"Đang upload lên R2..."</strong>:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-1 mb-3">
                                    <li>Vào Cloudflare R2 {'>'} Settings {'>'} CORS Policy.</li>
                                    <li>Dán JSON và Save.</li>
                                </ol>
                                <div className="relative group">
                                    <pre className="bg-black p-3 rounded text-[10px] font-mono text-green-400 overflow-x-auto border border-gray-700">{corsConfig}</pre>
                                    <button onClick={handleCopyCors} className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded hover:bg-gray-700 text-white" title="Sao chép"><DocumentDuplicateIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'supabase' && (
                            <div className="animate-fade-in-scale">
                                <p className="mb-2">
                                    Nếu lỗi <strong>"Failed to fetch"</strong> khi tải ảnh về, chạy lệnh này trong SQL Editor của Supabase để sửa lỗi CORS:
                                </p>
                                <div className="relative group mt-2">
                                    <pre className="bg-black p-3 rounded text-xs font-mono text-blue-300 overflow-x-auto border border-blue-500/30">
{sqlConfig}
                                    </pre>
                                    <button 
                                        onClick={handleCopySQL} 
                                        className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded hover:bg-gray-700 text-white flex items-center gap-1 text-xs" 
                                        title="Sao chép SQL"
                                    >
                                        {copiedSQL ? <CheckIcon className="w-4 h-4 text-green-500"/> : <DocumentDuplicateIcon className="w-4 h-4"/>}
                                        {copiedSQL ? 'Đã chép' : 'Copy SQL'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-cyber-surface/50 p-6 rounded-xl border border-cyber-pink/20 shadow-cyber-glow">
                <p className="mb-4 text-cyber-on-surface-secondary">
                    Công cụ này sẽ tiếp tục tải {stats.onSupabase} ảnh còn lại từ Supabase và chuyển sang R2.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <button 
                        onClick={fetchImages} 
                        disabled={isRefreshing || status === 'running'}
                        className="px-4 py-2 text-sm font-medium border border-cyber-pink/30 rounded-lg hover:bg-cyber-pink/10 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {isRefreshing ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>}
                        Làm mới
                    </button>
                    
                    <div className="flex-grow"></div>

                    {status === 'idle' && (
                        <button 
                            onClick={startMigration}
                            disabled={stats.onSupabase === 0}
                            className="px-8 py-3 bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white font-bold rounded-lg hover:shadow-cyber-glow transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {stats.onSupabase === 0 ? 'Tất cả đã ở R2' : 'Tiếp tục Di chuyển'}
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
                {status === 'running' && (
                    <div className="relative w-full bg-black/50 rounded-full h-6 mb-6 overflow-hidden border border-gray-700">
                        <div 
                            className="bg-gradient-to-r from-cyber-pink to-cyber-cyan h-full transition-all duration-300 ease-out flex items-center justify-center" 
                            style={{ width: `${progress}%` }}
                        >
                            {progress > 5 && <span className="text-[10px] font-bold text-white drop-shadow-md">{progress}%</span>}
                        </div>
                    </div>
                )}

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
