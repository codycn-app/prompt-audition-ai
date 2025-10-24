import React, { useState } from 'react';
import { Category } from '../types';
import { supabase } from '../supabaseClient';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CloseIcon } from './icons/CloseIcon';

interface CategoryManagementProps {
    categories: Category[];
    showToast: (message: string) => void;
    onUpdate: () => void; // Callback to refetch categories
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ categories, showToast, onUpdate }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingName, setEditingName] = useState('');
    const [error, setError] = useState('');

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Tên chuyên mục không được để trống.');
            return;
        }
        setError('');

        // Using .select().single() to ensure RLS policies allow returning the new row,
        // which can resolve permission-related insertion failures.
        const { data, error: insertError } = await supabase
            .from('categories')
            .insert({ name: newCategoryName.trim() })
            .select()
            .single();

        if (insertError) {
            // Handle unique constraint violation gracefully
            if (insertError.code === '23505') { // Code for unique violation in Postgres
                 showToast('Lỗi: Tên chuyên mục này đã tồn tại.');
            } else {
                showToast(`Lỗi: ${insertError.message}`);
            }
        } else if (!data) {
             showToast('Lỗi: Không thể tạo chuyên mục. Vui lòng kiểm tra quyền truy cập.');
        } else {
            showToast('Đã thêm chuyên mục mới!');
            setNewCategoryName('');
            onUpdate();
        }
    };
    
    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditingName('');
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa chuyên mục này? Các ảnh trong chuyên mục sẽ không bị xóa.')) {
            return;
        }
        const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
        if (deleteError) {
            showToast(`Lỗi: ${deleteError.message}`);
        } else {
            showToast('Đã xóa chuyên mục.');
            onUpdate();
            // If the deleted category was being edited, clear the editing state.
            if (editingCategory?.id === id) {
                handleCancelEdit();
            }
        }
    };

    const handleStartEdit = (category: Category) => {
        setEditingCategory(category);
        setEditingName(category.name);
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editingName.trim()) return;

        // Using .select().single() for update consistency and better RLS handling.
        const { data, error: updateError } = await supabase
            .from('categories')
            .update({ name: editingName.trim() })
            .eq('id', editingCategory.id)
            .select()
            .single();
        
        if (updateError) {
             if (updateError.code === '23505') {
                 showToast('Lỗi: Tên chuyên mục này đã tồn tại.');
            } else {
                showToast(`Lỗi: ${updateError.message}`);
            }
        } else if (!data) {
            showToast('Lỗi: Không thể cập nhật chuyên mục. Vui lòng kiểm tra quyền truy cập.');
        } else {
            showToast('Đã cập nhật chuyên mục.');
            handleCancelEdit();
            onUpdate();
        }
    };

    const inputStyle = "w-full p-2 bg-cyber-surface/50 border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-md focus:ring-cyber-pink focus:border-cyber-pink transition text-sm";
    
    return (
        <div className="space-y-6 animate-fade-in-scale">
            <div>
                <h3 className="text-lg font-semibold text-cyber-on-surface">Quản lý Chuyên mục</h3>
                <p className="mt-1 text-sm text-cyber-on-surface-secondary">
                    Thêm, sửa, hoặc xóa các chuyên mục. Các thay đổi sẽ được áp dụng cho toàn bộ người dùng.
                </p>
            </div>

            {/* Add New Category */}
            <div className="flex items-center gap-2 p-4 rounded-lg bg-cyber-black/20 border border-cyber-pink/10">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Tên chuyên mục mới..."
                    className={inputStyle}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
                />
                <button
                    onClick={handleAddCategory}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-cyber-on-surface bg-cyber-surface hover:bg-cyber-surface/50 active:scale-95 border-cyber-pink/20"
                >
                    <PlusIcon className="w-5 h-5"/>
                    Thêm
                </button>
            </div>
             {error && <p className="text-sm text-red-400">{error}</p>}

            {/* List of Categories */}
            <div className="space-y-2">
                <h4 className="text-md font-semibold text-cyber-on-surface-secondary">Danh sách chuyên mục</h4>
                {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-cyber-surface/50">
                        {editingCategory?.id === cat.id ? (
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className={inputStyle}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                            />
                        ) : (
                             <span className="text-cyber-on-surface">{cat.name}</span>
                        )}
                       
                        <div className="flex items-center gap-2">
                             {editingCategory?.id === cat.id ? (
                                <>
                                    <button onClick={handleSaveEdit} className="p-2 text-cyber-cyan hover:opacity-80 transition">
                                        <CheckIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={handleCancelEdit} className="p-2 text-cyber-on-surface-secondary hover:opacity-80 transition">
                                        <CloseIcon className="w-5 h-5"/>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => handleStartEdit(cat)} className="p-2 text-cyber-on-surface-secondary hover:text-cyber-cyan transition">
                                        <PencilIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-cyber-on-surface-secondary hover:text-rank-admin transition">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManagement;
