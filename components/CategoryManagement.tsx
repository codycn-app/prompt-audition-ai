import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../types';
import { getSupabaseClient } from '../supabaseClient';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CloseIcon } from './icons/CloseIcon';
import { useToast } from '../contexts/ToastContext';

interface CategoryManagementProps {
    categories: Category[];
    onUpdate: () => void; // Callback to refetch categories
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ categories, onUpdate }) => {
    const [editableCategories, setEditableCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingName, setEditingName] = useState('');
    const [error, setError] = useState('');
    const { showToast } = useToast();

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        // Sort categories by position before setting them, ensuring a consistent order.
        const sorted = [...categories].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
        setEditableCategories(sorted);
    }, [categories]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Tên chuyên mục không được để trống.');
            return;
        }
        setError('');

        const maxPosition = editableCategories.reduce((max, cat) => Math.max(max, cat.position ?? 0), 0);
        const newPosition = editableCategories.length > 0 ? maxPosition + 1 : 0;

        const supabase = getSupabaseClient();
        const { data, error: insertError } = await supabase
            .from('categories')
            .insert({ name: newCategoryName.trim(), position: newPosition })
            .select()
            .single();

        if (insertError) {
            if (insertError.code === '23505') {
                 showToast('Lỗi: Tên chuyên mục này đã tồn tại.', 'error');
            } else {
                showToast(`Lỗi: ${insertError.message}`, 'error');
            }
        } else if (!data) {
             showToast('Lỗi: Không thể tạo chuyên mục.', 'error');
        } else {
            showToast('Đã thêm chuyên mục mới!', 'success');
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
        const supabase = getSupabaseClient();
        const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
        if (deleteError) {
            showToast(`Lỗi: ${deleteError.message}`, 'error');
        } else {
            showToast('Đã xóa chuyên mục.', 'success');
            onUpdate();
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
        const supabase = getSupabaseClient();
        const { data, error: updateError } = await supabase
            .from('categories')
            .update({ name: editingName.trim() })
            .eq('id', editingCategory.id)
            .select()
            .single();
        
        if (updateError) {
             if (updateError.code === '23505') {
                 showToast('Lỗi: Tên chuyên mục này đã tồn tại.', 'error');
            } else {
                showToast(`Lỗi: ${updateError.message}`, 'error');
            }
        } else if (!data) {
            showToast('Lỗi: Không thể cập nhật chuyên mục.', 'error');
        } else {
            showToast('Đã cập nhật chuyên mục.', 'success');
            handleCancelEdit();
            onUpdate();
        }
    };

    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = async () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        const newCategories = [...editableCategories];
        const draggedItemContent = newCategories.splice(dragItem.current, 1)[0];
        newCategories.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        setEditableCategories(newCategories);
        
        const updates = newCategories.map((cat, index) => ({
            id: cat.id,
            position: index,
        }));
        
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('categories').upsert(updates);
        
        if (error) {
            showToast(`Lỗi lưu thứ tự: ${error.message}`, 'error');
            setEditableCategories(categories); // Revert on failure
        } else {
            showToast('Đã cập nhật thứ tự chuyên mục!', 'success');
            onUpdate();
        }
    };

    const inputStyle = "w-full p-2 bg-cyber-surface/50 border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-md focus:ring-cyber-pink focus:border-cyber-pink transition text-sm";
    
    return (
        <div className="space-y-6 animate-fade-in-scale">
            <div>
                <h3 className="text-lg font-semibold text-cyber-on-surface">Quản lý Chuyên mục</h3>
                <p className="mt-1 text-sm text-cyber-on-surface-secondary">
                    Thêm, sửa, hoặc xóa các chuyên mục. Kéo thả để sắp xếp lại thứ tự hiển thị.
                </p>
            </div>

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

            <div className="space-y-2">
                <h4 className="text-md font-semibold text-cyber-on-surface-secondary">Danh sách chuyên mục</h4>
                {editableCategories.map((cat, index) => (
                    <div 
                        key={cat.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-cyber-surface/50"
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="flex items-center flex-grow gap-3">
                            <span className="cursor-move text-cyber-on-surface-secondary hover:text-cyber-on-surface">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </span>
                            {editingCategory?.id === cat.id ? (
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className={`${inputStyle} flex-grow`}
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                                />
                            ) : (
                                <span className="text-cyber-on-surface flex-grow">{cat.name}</span>
                            )}
                        </div>
                       
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