import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { getSupabaseClient } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Category } from '../types';
import { useToast } from '../contexts/ToastContext';

interface AddImageModalProps {
  onClose: () => void;
  onAddImage: () => void;
  categories: Category[];
}

const AddImageModal: React.FC<AddImageModalProps> = ({ onClose, onAddImage, categories }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for image cropper
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropper, setShowCropper] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setOriginalDimensions({ width, height });
    // Show cropper only if image is landscape or square
    if (width >= height) {
      setShowCropper(true);
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          3 / 4, // Aspect ratio for vertical thumbnails
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
      // Also set an initial completed crop
      const pixelCrop = {
        unit: 'px' as 'px',
        x: (newCrop.x * width) / 100,
        y: (newCrop.y * height) / 100,
        width: (newCrop.width * width) / 100,
        height: (newCrop.height * height) / 100,
      };
      setCompletedCrop(pixelCrop);
    } else {
      setShowCropper(false);
      setCompletedCrop(undefined); // Ensure no crop data for portrait images
    }
  }

  const processFile = (file: File | undefined) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Kích thước file phải nhỏ hơn 5MB.');
        return;
      }
      setCrop(undefined) // Reset crop on new file
      setShowCropper(false);
      setImageFile(file);
      setImgSrc(URL.createObjectURL(file));
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
    
    const supabase = getSupabaseClient();
    let imagePath = '';
    let newImageId: number | null = null;

    try {
        const fileExt = imageFile.name.split('.').pop();
        imagePath = `${currentUser.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(imagePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(imagePath);
        if (!urlData) throw new Error("Không thể lấy URL của ảnh.");
        
        const { data: newImage, error: imageInsertError } = await supabase
            .from('images')
            .insert({
                title: title,
                prompt: prompt,
                image_url: urlData.publicUrl,
                user_id: currentUser.id,
                likes: [],
                views: 0,
                thumbnail_crop_data: showCropper ? completedCrop : null,
                original_width: originalDimensions.width,
                original_height: originalDimensions.height,
            })
            .select('id')
            .single();

        if (imageInsertError) throw imageInsertError;
        if (!newImage) throw new Error("Không thể tạo bản ghi ảnh.");
        
        newImageId = newImage.id;

        const categoryLinks = selectedCategoryIds.map(catId => ({
            image_id: newImageId,
            category_id: catId
        }));
        
        const { error: categoryInsertError } = await supabase
            .from('image_categories')
            .insert(categoryLinks);

        if (categoryInsertError) throw categoryInsertError;

        onAddImage();

    } catch (err: any) {
        console.error("Error adding image:", err);
        const errorMessage = `Lỗi từ server: ${err.message}` || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        setError(errorMessage);
        showToast(errorMessage, 'error');

        if (imagePath) {
            await supabase.storage.from('images').remove([imagePath]);
        }
        if (newImageId) {
            await supabase.from('image_categories').delete().eq('image_id', newImageId);
            await supabase.from('images').delete().eq('id', newImageId);
        }
    } finally {
        setIsSaving(false);
    }
  };


  const formInputStyle = "w-full p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition";
  const dropzoneBaseClasses = "flex flex-col items-center justify-center w-full transition-colors border-2 border-dashed rounded-lg cursor-pointer min-h-52";
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
            {!imgSrc && (
                 <div className="flex items-center justify-center w-full">
                    <label 
                        htmlFor="dropzone-file" 
                        className={`${dropzoneBaseClasses} ${dropzoneStateClasses}`}
                        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <UploadIcon className="w-10 h-10 mb-3 text-cyber-on-surface-secondary"/>
                            <p className="mb-2 text-sm text-cyber-on-surface-secondary"><span className="font-semibold text-cyber-on-surface">Nhấn hoặc Kéo ảnh vào đây</span></p>
                            <p className="text-xs text-cyber-on-surface-secondary">{isDragging ? 'Thả ảnh để tải lên!' : 'PNG, JPG hoặc WEBP (TỐI ĐA 5MB)'}</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                    </label>
                </div>
            )}
            {imgSrc && (
                <div className="p-2 rounded-lg bg-cyber-black/20">
                    {showCropper && <p className="mb-2 text-sm text-center text-cyber-on-surface-secondary">Chọn vùng hiển thị cho ảnh thumbnail</p>}
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={3/4}
                        className={!showCropper ? 'hidden' : ''}
                    >
                        <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} className="max-h-[50vh] object-contain"/>
                    </ReactCrop>
                    {!showCropper && (
                         <img ref={imgRef} alt="Image Preview" src={imgSrc} onLoad={onImageLoad} className="w-full max-h-[50vh] object-contain rounded-md"/>
                    )}
                </div>
            )}
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