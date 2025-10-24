import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Category } from '../types';

interface AddImageModalProps {
  onClose: () => void;
  onAddImage: () => void;
  showToast: (message: string) => void;
  categories: Category[];
}

const AddImageModal: React.FC<AddImageModalProps> = ({ onClose, onAddImage, showToast, categories }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const processFile = (file: File | undefined) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Kích thước file phải nhỏ hơn 5MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Bạn phải đăng nhập để thêm ảnh.');
      return;
    }
    if (!title || !prompt || !imageFile || selectedCategoryIds.length === 0) {
      setError('Vui lòng điền tiêu đề, prompt, chọn ảnh và ít nhất một chuyên mục.');
      return;
    }
    
    setIsSaving(true);
    setError('');

    let imagePath = '';
    let newImageId: number | null = null;

    try {
        // 1. Upload image file to storage
        const fileExt = imageFile.name.split('.').pop();
        imagePath = `${currentUser.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(imagePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(imagePath);
        if (!urlData) throw new Error("Không thể lấy URL của ảnh.");

        // 2. Insert into 'images' table, ensuring we get the new ID back
        const { data: newImageData, error: imageInsertError } = await supabase
            .from('images')
            .insert({ 
                title, 
                prompt, 
                image_url: urlData.publicUrl, // Correct snake_case column name
                user_id: currentUser.id 
            })
            .select('id')
            .single();

        if (imageInsertError) throw imageInsertError;
        if (!newImageData) throw new Error('Không thể tạo bản ghi ảnh mới.');
        
        newImageId = newImageData.id;

        // 3. Insert into 'image_categories' junction table
        const categoryLinks = selectedCategoryIds.map(categoryId => ({
            image_id: newImageId,
            category_id: categoryId,
            user_id: currentUser.id // RLS policy requires this
        }));

        const { error: categoryInsertError } = await supabase
            .from('image_categories')
            .insert(categoryLinks)
            .select(); // Important to get a response and not hang

        if (categoryInsertError) throw categoryInsertError;

        onAddImage();

    } catch (err: any) {
        console.error("Error adding image:", err);
        setError(`Lỗi từ server: ${err.message}` || 'Đã có lỗi xảy ra. Vui lòng thử lại.');

        // Cleanup: If any step fails, remove the created records and files.
        if (newImageId) {
            await supabase.from('images').delete().eq('id', newImageId);
        }
        if (imagePath) {
            await supabase.storage.from('images').remove([imagePath]);
        }
    } finally {
        setIsSaving(false);
    }
  };


  const formInputStyle = "w-full p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition";
  const dropzoneBaseClasses = "flex flex-col items-center justify-center w-full transition-colors border-2 border-dashed rounded-lg cursor-pointer h-52";
  const dropzoneStateClasses = isDragging ? "bg-cyber-cyan/20 border-cyber-cyan" : "bg-cyber-surface/50 hover:bg-cyber-surface/80 border-cyber-pink/30";


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
          <h2 className="text-xl font-semibold">Thêm Ảnh Mới</h2>
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
            <label className="block mb-2 text-sm font-medium text-cyber-on-surface">Ảnh</label>
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="dropzone-file" 
                className={`${dropzoneBaseClasses} ${dropzoneStateClasses}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="object-cover h-full max-w-full rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadIcon className="w-10 h-10 mb-3 text-cyber-on-surface-secondary"/>
                    <p className="mb-2 text-sm text-cyber-on-surface-secondary"><span className="font-semibold text-cyber-on-surface">Nhấn hoặc Kéo ảnh vào đây</span></p>
                    <p className="text-xs text-cyber-on-surface-secondary">{isDragging ? 'Thả ảnh để tải lên!' : 'PNG, JPG hoặc WEBP (TỐI ĐA 5MB)'}</p>
                  </div>
                )}
                <input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-cyber-on-surface">Tiêu đề</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={formInputStyle} placeholder="Bình minh trên đỉnh núi..." required />
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
            <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-cyber-on-surface">Câu Lệnh (Prompt)</label>
            <textarea id="prompt" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} className={formInputStyle} placeholder="Một thành phố tương lai với những tòa nhà chọc trời..."></textarea>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end pt-2 space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-cyber-on-surface bg-cyber-surface/50 rounded-lg hover:bg-cyber-surface transition active:scale-95">Hủy</button>
            <button 
              type="submit" 
              className="flex items-center justify-center w-28 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                  <span>Đang...</span>
                </>
              ) : (
                <span>Lưu</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddImageModal;