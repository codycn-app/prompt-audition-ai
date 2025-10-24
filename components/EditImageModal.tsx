import React, { useState } from 'react';
import { ImagePrompt } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface EditImageModalProps {
  image: ImagePrompt;
  onClose: () => void;
  onUpdateImage: (image: Pick<ImagePrompt, 'id' | 'title' | 'prompt' | 'keywords'>) => void;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ image, onClose, onUpdateImage }) => {
  const [title, setTitle] = useState(image.title);
  const [prompt, setPrompt] = useState(image.prompt);
  const [keywords, setKeywords] = useState(image.keywords.join(', '));
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !prompt || !keywords) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    const keywordsArray = keywords.split(',').map(kw => kw.trim()).filter(Boolean);
    if (keywordsArray.length === 0) {
      setError('Vui lòng nhập ít nhất một từ khóa.');
      return;
    }
    onUpdateImage({ id: image.id, title, prompt, keywords: keywordsArray });
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div>
            <img src={image.imageUrl} alt="Preview" className="object-contain w-full rounded-lg max-h-60" />
          </div>
          <div>
            <label htmlFor="title-edit" className="block mb-2 text-sm font-medium text-cyber-on-surface">Tiêu đề</label>
            <input id="title-edit" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={formInputStyle} required />
          </div>
          <div>
            <label htmlFor="prompt-edit" className="block mb-2 text-sm font-medium text-cyber-on-surface">Câu Lệnh (Prompt)</label>
            <textarea id="prompt-edit" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} className={formInputStyle} placeholder="Một thành phố tương lai với những tòa nhà chọc trời..."></textarea>
          </div>
          <div>
            <label htmlFor="keywords-edit" className="block mb-2 text-sm font-medium text-cyber-on-surface">Từ khóa (phân cách bằng dấu phẩy)</label>
            <input id="keywords-edit" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} className={formInputStyle} placeholder="sci-fi, city, neon, futuristic"/>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end pt-2 space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-cyber-on-surface bg-cyber-surface/50 rounded-lg hover:bg-cyber-surface transition active:scale-95">Hủy</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditImageModal;