import React, { useState } from 'react';
import { ImagePrompt, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { supabase } from '../supabaseClient';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { useAuth } from '../contexts/AuthContext';

interface EditImageModalProps {
  image: ImagePrompt;
  categories: Category[];
  onClose: () => void;
  onUpdateImage: () => void;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ image, categories, onClose, onUpdateImage }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState(image.title);
  const [prompt, setPrompt] = useState(image.prompt);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(image.categories.map(c => c.id));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
        setError('Phiên đăng nhập đã hết hạn.');
        return;
    }
    if (!title || !prompt || selectedCategoryIds.length === 0) {
      setError('Vui lòng điền tiêu đề, prompt và chọn ít nhất một chuyên mục.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
        // Call the server-side function to handle all DB updates atomically.
        const { error: rpcError } = await supabase.rpc('update_image_with_categories', {
            image_id_to_update: image.id,
            title_text: title,
            prompt_text: prompt,
            category_ids: selectedCategoryIds
        });
        
        if (rpcError) throw rpcError;
        
        onUpdateImage();
    } catch (err: any) {
      console.error("Error updating image:", err);
      setError(`Lỗi từ server: ${err.message}` || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const formInputStyle = "w-full p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-full overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow-lg"
        onClick={(e) => e.stopPropagation()}
        style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, #FF00E6, #00FFFF) border-box'}}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyber-pink/20">
          <h2 className="text-xl font-semibold">Chỉnh sửa Ảnh</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-cyber-surface active:scale-95"
            aria-label="Đóng"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] custom-scrollbar">
          <div>
            <img src={image.image_url} alt="Preview" className="object-contain w-full rounded-lg max-h-60" />
          </div>
          <div>
            <label htmlFor="title-edit" className="block mb-2 text-sm font-medium text-cyber-on-surface">Tiêu đề</label>
            <input id="title-edit" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={formInputStyle} required />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-cyber-on-surface">Chuyên mục</label>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-cyber-black/20 max-h-32 overflow-y-auto custom-scrollbar">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded-md hover:bg-cyber-surface/50">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={() => handleCategoryChange(cat.id)}
                    className="w-4 h-4 rounded text-cyber-pink bg-cyber-surface border-cyber-pink/50 focus:ring-cyber-pink"
                  />
                  <span className="text-sm text-cyber-on-surface">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="prompt-edit" className="block mb-2 text-sm font-medium text-cyber-on-surface">Câu Lệnh (Prompt)</label>
            <textarea id="prompt-edit" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} className={formInputStyle} placeholder="Một thành phố tương lai với những tòa nhà chọc trời..."></textarea>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end pt-2 space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-cyber-on-surface bg-cyber-surface/50 rounded-lg hover:bg-cyber-surface transition active:scale-95">Hủy</button>
            <button 
              type="submit" 
              className="flex items-center justify-center w-36 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditImageModal;