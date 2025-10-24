import React, { useState } from 'react';
import { ImagePrompt } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { GoogleGenAI, Type } from '@google/genai';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface AddImageModalProps {
  onClose: () => void;
  onAddImage: () => void;
  showToast: (message: string) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


const AddImageModal: React.FC<AddImageModalProps> = ({ onClose, onAddImage, showToast }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleSuggestPrompt = async () => {
    if (!imageFile) {
        setError('Vui lòng chọn một ảnh trước.');
        return;
    }
    if (!import.meta.env.VITE_API_KEY) {
        setError('Lỗi cấu hình: API Key chưa được thiết lập.');
        return;
    }
    setIsGenerating(true);
    setError('');
    try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

        const base64Data = await blobToBase64(imageFile);
        
        const imagePart = {
            inlineData: {
                mimeType: imageFile.type,
                data: base64Data,
            },
        };

        const textPart = {
            text: "Hãy mô tả chi tiết hình ảnh này để tạo câu lệnh cho AI tạo hình ảnh. Tập trung vào các đối tượng, bối cảnh, tâm trạng và phong cách. Cung cấp mô tả bằng tiếng Việt.",
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        
        setPrompt(response.text);

    } catch (err) {
        console.error(err);
        setError('Không thể tạo gợi ý. Vui lòng thử lại.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Bạn phải đăng nhập để thêm ảnh.');
      return;
    }
    if (!title || !prompt || !imageFile) {
      setError('Vui lòng điền tiêu đề, tải ảnh lên và nhập câu lệnh.');
      return;
    }
    if (!import.meta.env.VITE_API_KEY) {
        setError('Lỗi cấu hình: API Key chưa được thiết lập. Không thể lưu.');
        return;
    }
    
    setIsSaving(true);
    setError('');

    try {
        // 1. Upload image to Supabase Storage
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars') // FIX: Changed bucket from 'images' to 'avatars'
            .upload(filePath, imageFile);

        if (uploadError) throw new Error(`Lỗi tải ảnh lên: ${uploadError.message}`);

        // 2. Get public URL
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath); // FIX: Changed bucket from 'images' to 'avatars'
        if (!urlData) throw new Error("Không thể lấy URL của ảnh.");
        const imageUrl = urlData.publicUrl;
        
        // 3. Generate keywords with AI
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        const base64Data = await blobToBase64(imageFile);
        
        const imagePart = { inlineData: { mimeType: imageFile.type, data: base64Data } };
        const textPart = { text: `Dựa vào hình ảnh, tiêu đề "${title}" và mô tả sau: "${prompt}", hãy tạo ra 5 từ khóa (keywords) phù hợp nhất bằng tiếng Việt. Các từ khóa nên là từ đơn hoặc cụm từ ngắn gọn, không chứa dấu gạch đầu dòng hay đánh số.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { keywords: { type: Type.ARRAY, description: 'Một mảng chứa 5 từ khóa tiếng Việt.', items: { type: Type.STRING }}},
                    required: ['keywords'],
                }
            }
        });
        
        const result = JSON.parse(response.text);
        const generatedKeywords = result.keywords;

        if (!Array.isArray(generatedKeywords) || generatedKeywords.length === 0) {
            throw new Error("AI không thể tạo từ khóa. Vui lòng thử lại.");
        }

        // 4. Insert into database
        const newImagePayload: Omit<ImagePrompt, 'id' | 'created_at'> = {
            title,
            prompt,
            keywords: generatedKeywords,
            imageUrl,
            userId: currentUser.id,
            likes: [],
            views: 0,
        };
        const { error: insertError } = await supabase.from('images').insert(newImagePayload);

        if (insertError) throw new Error(`Lỗi lưu vào database: ${insertError.message}`);

        onAddImage();

    } catch (err: any) {
        console.error("Error adding image:", err);
        setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="prompt" className="block text-sm font-medium text-cyber-on-surface">Câu Lệnh (Prompt)</label>
              <button 
                type="button" 
                onClick={handleSuggestPrompt}
                disabled={isGenerating || !imageFile || isSaving}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all duration-200 rounded-full text-cyber-black bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
              >
                <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Đang xử lý...' : 'Gợi ý câu lệnh'}
              </button>
            </div>
            <textarea id="prompt" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} className={formInputStyle} placeholder="Một thành phố tương lai với những tòa nhà chọc trời..."></textarea>
          </div>
          
          <div className='pt-2'>
            <p className='text-sm text-cyber-on-surface-secondary'>5 từ khóa sẽ được tự động tạo bởi AI khi bạn nhấn Lưu.</p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end pt-2 space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-cyber-on-surface bg-cyber-surface/50 rounded-lg hover:bg-cyber-surface transition active:scale-95">Hủy</button>
            <button 
              type="submit" 
              className="flex items-center justify-center w-28 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={isSaving || isGenerating}
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