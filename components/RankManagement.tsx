import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Rank } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { useToast } from '../contexts/ToastContext';

const RankManagement: React.FC = () => {
    const { ranks, updateRanks } = useAuth();
    const { showToast } = useToast();
    const [editableRanks, setEditableRanks] = useState<Rank[]>(JSON.parse(JSON.stringify(ranks))); // Deep copy
    const [error, setError] = useState('');

    const handleRankChange = (index: number, field: keyof Rank, value: string | number) => {
        const newRanks = [...editableRanks];
        (newRanks[index] as any)[field] = value;
        setEditableRanks(newRanks);
    };

    const handleIconUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1 * 1024 * 1024) { // 1MB limit for icons
                showToast('Kích thước icon phải nhỏ hơn 1MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                handleRankChange(index, 'icon', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddRank = () => {
        const newRank: Rank = {
            name: 'Cấp bậc mới',
            requiredExp: Math.max(...editableRanks.map(r => r.requiredExp >= 0 ? r.requiredExp : 0)) + 100,
            color: '#ffffff',
            icon: ''
        };
        setEditableRanks([...editableRanks, newRank]);
    };

    const handleRemoveRank = (index: number) => {
        if (editableRanks[index].requiredExp === -1) {
            showToast('Không thể xóa cấp bậc Quản trị viên.', 'error');
            return;
        }
        if (editableRanks[index].requiredExp === 0) {
            showToast('Không thể xóa cấp bậc mặc định (0 EXP).', 'error');
            return;
        }
        const newRanks = editableRanks.filter((_, i) => i !== index);
        setEditableRanks(newRanks);
    };

    const handleSaveChanges = () => {
        setError('');
        // Validation
        const requiredExpSet = new Set<number>();
        for (const rank of editableRanks) {
            if (!rank.name.trim()) {
                setError('Tên cấp bậc không được để trống.');
                return;
            }
            if (requiredExpSet.has(rank.requiredExp)) {
                setError(`Yêu cầu EXP "${rank.requiredExp}" bị trùng lặp. Mỗi cấp bậc phải có yêu cầu riêng.`);
                return;
            }
            requiredExpSet.add(rank.requiredExp);
        }

        try {
            updateRanks(editableRanks);
            showToast('Đã lưu thay đổi hệ thống cấp bậc!', 'success');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const inputStyle = "w-full p-2 bg-cyber-surface/50 border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-md focus:ring-cyber-pink focus:border-cyber-pink transition text-sm";
    
    return (
        <div className="space-y-6 animate-fade-in-scale">
            <div>
                <h3 className="text-lg font-semibold text-cyber-on-surface">Cấu hình Cấp bậc</h3>
                <p className="mt-1 text-sm text-cyber-on-surface-secondary">
                    Tùy chỉnh tên, icon, màu sắc và điểm EXP yêu cầu cho từng cấp bậc. Các thay đổi sẽ được áp dụng toàn hệ thống.
                </p>
            </div>

            <div className="space-y-4">
                {editableRanks.sort((a,b) => a.requiredExp - b.requiredExp).map((rank, index) => {
                    // Find the original index before sorting to modify the correct item
                    const originalIndex = editableRanks.findIndex(r => r === rank);
                    const isAdminRank = rank.requiredExp === -1;

                    return (
                        <div key={originalIndex} className="p-4 rounded-lg bg-cyber-black/20 border border-cyber-pink/10">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                {/* Preview */}
                                <div className="md:col-span-3 flex items-center gap-3">
                                    {rank.icon ? 
                                       <img src={rank.icon} alt={rank.name} className="w-8 h-8 flex-shrink-0" /> :
                                       <div className="w-8 h-8 rounded bg-cyber-surface flex-shrink-0"></div>
                                    }
                                    <span className="font-semibold" style={{ color: rank.color }}>{rank.name}</span>
                                </div>
                                {/* Name */}
                                <div className="md:col-span-3">
                                    <label className="text-xs text-cyber-on-surface-secondary block mb-1">Tên Cấp bậc</label>
                                    <input 
                                        type="text" 
                                        value={rank.name}
                                        onChange={(e) => handleRankChange(originalIndex, 'name', e.target.value)}
                                        className={inputStyle}
                                        disabled={isAdminRank}
                                    />
                                </div>
                                {/* Required EXP */}
                                <div className="md:col-span-2">
                                     <label className="text-xs text-cyber-on-surface-secondary block mb-1">EXP Yêu cầu</label>
                                    <input 
                                        type="number"
                                        value={rank.requiredExp}
                                        onChange={(e) => handleRankChange(originalIndex, 'requiredExp', parseInt(e.target.value) || 0)}
                                        className={inputStyle}
                                        disabled={isAdminRank}
                                    />
                                </div>
                                 {/* Color */}
                                <div className="md:col-span-2 flex items-end gap-2">
                                    <div className="flex-grow">
                                        <label className="text-xs text-cyber-on-surface-secondary block mb-1">Mã màu</label>
                                        <input 
                                            type="text" 
                                            value={rank.color}
                                            onChange={(e) => handleRankChange(originalIndex, 'color', e.target.value)}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <input 
                                        type="color" 
                                        value={rank.color}
                                        onChange={(e) => handleRankChange(originalIndex, 'color', e.target.value)}
                                        className="w-9 h-9 p-0 bg-transparent border-none rounded cursor-pointer"
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end items-center">
                                    {!isAdminRank && (
                                        <button onClick={() => handleRemoveRank(originalIndex)} className="p-2 text-cyber-on-surface-secondary hover:text-rank-admin transition">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                 {/* Icon URL and Upload */}
                                <div className="md:col-span-12 grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-10">
                                        <label className="text-xs text-cyber-on-surface-secondary block mb-1">URL Biểu tượng (hoặc tải lên)</label>
                                        <input
                                            type="text"
                                            placeholder="https://imgur.com/your-icon.gif"
                                            value={rank.icon}
                                            onChange={(e) => handleRankChange(originalIndex, 'icon', e.target.value)}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <label htmlFor={`icon-upload-${originalIndex}`} className="mt-4 p-2 cursor-pointer text-cyber-on-surface-secondary hover:text-cyber-cyan transition">
                                            <UploadIcon className="w-6 h-6"/>
                                        </label>
                                        <input type="file" id={`icon-upload-${originalIndex}`} className="hidden" accept="image/*" onChange={(e) => handleIconUpload(originalIndex, e)}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleAddRank}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-cyber-on-surface bg-cyber-surface hover:bg-cyber-surface/50 active:scale-95 border-cyber-pink/20"
            >
                <PlusIcon className="w-5 h-5"/>
                Thêm Cấp bậc
            </button>
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end pt-4 border-t border-cyber-pink/10">
                <button 
                    onClick={handleSaveChanges}
                    className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95"
                >
                    Lưu thay đổi
                </button>
            </div>
        </div>
    );
};

export default RankManagement;