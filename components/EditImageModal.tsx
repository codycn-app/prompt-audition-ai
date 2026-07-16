import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import { ImagePrompt, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { getSupabaseClient } from '../supabaseClient';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { useAuth } from '../contexts/AuthContext';
import { deleteFile, uploadFile } from '../lib/storage';

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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(image.categories?.map(c => c.id) || []);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementPreview, setReplacementPreview] = useState<string | null>(null);

  // State for image cropper
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(
    image.thumbnail_crop_data ? { ...image.thumbnail_crop_data, unit: 'px' } : null
  );
  const [showCropper, setShowCropper] = useState(false);
  // FIX: Added state to store original image dimensions, which was missing.
  const [originalDimensions, setOriginalDimensions] = useState({ width: image.original_width || 0, height: image.original_height || 0 });


  useEffect(() => {
    // Prioritize freshly measured dimensions over potentially null DB values
    const width = replacementFile ? originalDimensions.width : (originalDimensions.width || image.original_width || 0);
    const height = replacementFile ? originalDimensions.height : (originalDimensions.height || image.original_height || 0);
    const isWide = width >= height && width > 0;

    if (isWide) {
      setShowCropper(true);
      // Initialize crop from saved data if it exists
      if (!replacementFile && image.thumbnail_crop_data && width && height) {
        const savedCrop = image.thumbnail_crop_data;
        setCrop({
          unit: '%',
          x: (savedCrop.x / width) * 100,
          y: (savedCrop.y / height) * 100,
          width: (savedCrop.width / width) * 100,
          height: (savedCrop.height / height) * 100,
        });
      }
    } else {
      setShowCropper(false);
    }
  }, [image, originalDimensions, replacementFile]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // CRITICAL FIX: Always capture and store the image's real dimensions.
    // This backfills data for old images that don't have these values in the DB.
    setOriginalDimensions({ width, height });

    // If the image is wide but has no pre-existing crop data, create a default centered one.
    if (width >= height && (replacementFile || !image.thumbnail_crop_data)) {
        setShowCropper(true);
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90, }, 3/4, width, height),
            width, height
        );
        setCrop(newCrop);
    }
  }

  const handleReplacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Ảnh thay thế phải là PNG, JPG hoặc WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh thay thế phải nhỏ hơn 5MB.');
      return;
    }

    if (replacementPreview) URL.revokeObjectURL(replacementPreview);
    setReplacementFile(file);
    setReplacementPreview(URL.createObjectURL(file));
    setOriginalDimensions({ width: 0, height: 0 });
    setCrop(undefined);
    setCompletedCrop(null);
    setShowCropper(false);
    setError('');
  };


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

    const supabase = getSupabaseClient();
    let replacementUploadUrl = '';
    let didUpdateImage = false;
    try {
        let imageUrlToSave = image.image_url;
        if (replacementFile) {
            const fileExt = replacementFile.name.split('.').pop() || 'jpg';
            const fileName = `${currentUser.id}/${Date.now()}_replacement.${fileExt}`;
            replacementUploadUrl = await uploadFile(replacementFile, 'images', fileName);
            imageUrlToSave = replacementUploadUrl;
        }

        // CRITICAL FIX: Include original_width and original_height in the update payload.
        const { error: updateError } = await supabase
            .from('images')
            .update({ 
                title, 
                prompt,
                image_url: imageUrlToSave,
                thumbnail_crop_data: showCropper ? completedCrop : null,
                original_width: originalDimensions.width,
                original_height: originalDimensions.height,
            })
            .eq('id', image.id);

        if (updateError) throw updateError;
        didUpdateImage = true;

        const { data: currentLinks, error: currentLinksError } = await supabase
            .from('image_categories')
            .select('category_id')
            .eq('image_id', image.id);

        if (currentLinksError) throw currentLinksError;

        const currentCategoryIds = new Set((currentLinks || []).map(link => link.category_id));
        const categoriesToAdd = selectedCategoryIds.filter(catId => !currentCategoryIds.has(catId));
        const categoriesToRemove = [...currentCategoryIds].filter(catId => !selectedCategoryIds.includes(catId));

        // Add new links before removing old ones so a failed request never leaves
        // the image without any category.
        const newCategoryLinks = categoriesToAdd.map(catId => ({
            image_id: image.id,
            category_id: catId
        }));

        if (newCategoryLinks.length > 0) {
            const { error: insertError } = await supabase
                .from('image_categories')
                .insert(newCategoryLinks);

            if (insertError) throw insertError;
        }

        if (categoriesToRemove.length > 0) {
            const { error: deleteError } = await supabase
                .from('image_categories')
                .delete()
                .eq('image_id', image.id)
                .in('category_id', categoriesToRemove);

            if (deleteError) throw deleteError;
        }

        const { data: savedLinks, error: verifyError } = await supabase
            .from('image_categories')
            .select('category_id')
            .eq('image_id', image.id);

        if (verifyError) throw verifyError;

        const savedCategoryIds = new Set((savedLinks || []).map(link => link.category_id));
        const categoriesMatch = savedCategoryIds.size === selectedCategoryIds.length
            && selectedCategoryIds.every(catId => savedCategoryIds.has(catId));

        if (!categoriesMatch) {
            throw new Error('Không thể xác nhận chuyên mục đã được lưu. Vui lòng thử lại.');
        }

        if (replacementUploadUrl && image.image_url !== replacementUploadUrl) {
            try {
                await deleteFile(image.image_url);
            } catch (deleteError) {
                console.warn('Không thể xóa file ảnh cũ sau khi thay thế:', deleteError);
            }
        }

        onUpdateImage();
    } catch (err: any) {
      console.error("Error updating image:", err);
      if (replacementUploadUrl && !didUpdateImage) {
        try {
          await deleteFile(replacementUploadUrl);
        } catch (cleanupError) {
          console.warn('Không thể dọn file ảnh thay thế:', cleanupError);
        }
      }
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
            <div className="p-2 rounded-lg bg-cyber-black/20">
                {showCropper && <p className="mb-2 text-sm text-center text-cyber-on-surface-secondary">Chỉnh lại vùng hiển thị cho thumbnail</p>}
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={3/4}
                    className={!showCropper ? 'hidden' : ''}
                >
                    <img ref={imgRef} alt={image.title} src={replacementPreview || image.image_url} onLoad={onImageLoad} className="max-h-[50vh] object-contain"/>
                </ReactCrop>
                {!showCropper && (
                     <img ref={imgRef} alt={image.title} src={replacementPreview || image.image_url} onLoad={onImageLoad} className="w-full max-h-[50vh] object-contain rounded-md"/>
                )}
            </div>
            <div className="mt-3">
              <label htmlFor="replacement-image" className="inline-flex cursor-pointer items-center rounded-lg border border-cyber-cyan/40 px-4 py-2 text-sm font-semibold text-cyber-cyan transition hover:bg-cyber-cyan/10">
                {replacementFile ? 'Chọn ảnh khác' : 'Tải ảnh thay thế'}
              </label>
              <input id="replacement-image" type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleReplacementChange} />
              <p className="mt-1 text-xs text-cyber-on-surface-secondary">Dùng khi file ảnh hiện tại bị mất hoặc không tải được. Tối đa 5MB.</p>
            </div>
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
