import React, { useState } from 'react';
import { ImagePrompt, User, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PencilIcon } from './icons/PencilIcon';
import { useAuth } from '../contexts/AuthContext';
import { getRankInfo } from '../lib/ranking';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

interface ImageDetailModalProps {
  image: ImagePrompt;
  images: ImagePrompt[];
  onClose: () => void;
  onRequestDelete: () => void;
  onRequestEdit: (image: ImagePrompt) => void;
  onCopyPrompt: (prompt: string) => Promise<void>;
  currentUser: User | null;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({ 
    image, images, onClose, onRequestDelete, onRequestEdit, onCopyPrompt, currentUser
}) => {
  const [copied, setCopied] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const { ranks } = useAuth();
  
  const isOwner = currentUser && currentUser.id === image.user_id;
  const isAdmin = currentUser?.role === 'admin';
  const canEditOrDelete = isOwner || isAdmin;

  const author = image.profiles;
  const authorRankInfo = getRankInfo(author, images, ranks);
  const { icon: rankIcon, name: rankName, className: rankClassName, finalColor: rankColor } = authorRankInfo;

  const handleCopyPrompt = async () => {
    await onCopyPrompt(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
        onClick={onClose}
      >
        <div 
          className="relative flex flex-col w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-xl shadow-2xl md:flex-row bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow-lg"
          onClick={(e) => e.stopPropagation()}
          style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, #FF00E6, #00FFFF) border-box'}}
        >
          <button 
            onClick={onClose}
            className="absolute z-10 p-2 text-gray-300 transition-colors duration-200 bg-black/50 rounded-full top-3 right-3 hover:bg-white/20 active:scale-95"
            aria-label="Đóng"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
          <div className="relative flex-shrink-0 w-full bg-black h-[40vh] md:w-[60%] md:h-auto">
            <img src={image.image_url} alt={image.prompt} className="object-contain w-full h-full" />
          </div>
          <div className="flex flex-col flex-grow p-4 space-y-4 overflow-y-auto md:p-6 custom-scrollbar">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold leading-tight font-oxanium text-cyber-on-surface">{image.title}</h2>
            </div>
            
            {/* Author Info */}
            <div>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-cyber-on-surface-secondary">Tác giả</h3>
                <div className="flex items-center gap-3 mt-2">
                    {author?.avatarUrl ? (
                        <img src={author.avatarUrl} alt={author.username} className="w-10 h-10 rounded-full object-cover"/>
                    ) : (
                        <span className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full bg-gradient-to-br from-cyber-pink to-cyber-cyan text-cyber-black">
                            {author?.username.charAt(0).toUpperCase() ?? '?'}
                        </span>
                    )}
                    <div>
                        <span className={`font-semibold ${rankClassName}`} style={{ color: rankColor }}>{author?.username ?? 'Người dùng không xác định'}</span>
                        <div className="flex items-center gap-1.5 text-sm">
                            {rankIcon && <img src={rankIcon} alt={rankName} className="w-4 h-4" />}
                            <span 
                                className="text-cyber-on-surface-secondary"
                                style={{ color: rankColor }}
                            >
                                {rankName}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Prompt */}
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase text-cyber-pink">Câu Lệnh (Prompt)</h3>
              <div className="p-3 mt-2 border rounded-lg bg-cyber-black/20 border-cyber-pink/20">
                  <div className="pr-2 max-h-24 overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-cyber-on-surface-secondary whitespace-pre-wrap">{image.prompt}</p>
                  </div>
              </div>
              <div className="flex items-center justify-end mt-2 gap-2">
                 <button
                    onClick={() => setIsGuideModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 border border-transparent rounded-full shadow-md outline-none bg-gradient-to-r from-cyber-cyan/80 to-blue-500/80 group hover:shadow-cyber-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-surface focus:ring-cyber-cyan active:scale-95"
                  >
                    <InformationCircleIcon className="w-4 h-4" />
                    Hướng dẫn
                  </button>
                 <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 border border-transparent rounded-full shadow-md outline-none bg-gradient-to-r from-cyber-pink/80 to-cyber-cyan/80 group hover:shadow-cyber-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-surface focus:ring-cyber-pink active:scale-95"
                  >
                    {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                    {copied ? 'Đã sao chép!' : 'Sao chép'}
                  </button>
              </div>
            </div>
            {/* Category */}
            {image.categories && image.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-cyber-cyan">Chuyên mục</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                    {image.categories.map((cat: Category) => (
                      <span key={cat.id} className="px-3 py-1 text-sm rounded-full bg-cyber-cyan/10 text-cyber-cyan ring-1 ring-inset ring-cyber-cyan/20">
                        {cat.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
            
            <div className="flex-grow"></div>
            
            <div className="text-sm text-cyber-on-surface-secondary">
              <p><span className="font-semibold">Tạo lúc:</span> {new Date(image.created_at).toLocaleString('vi-VN')}</p>
            </div>
            <div className="flex flex-col gap-3">
              {/* Admin/Owner Buttons */}
              {canEditOrDelete && (
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-cyber-pink/10">
                      <span className="text-xs text-cyber-on-surface-secondary">Công cụ quản lý:</span>
                      <button onClick={() => onRequestEdit(image)} className="p-2 text-gray-400 transition-colors duration-200 border rounded-lg border-cyber-surface/50 bg-transparent hover:border-cyber-cyan hover:text-cyber-cyan active:scale-95" aria-label="Sửa ảnh">
                          <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={onRequestDelete} className="p-2 text-gray-400 transition-colors duration-200 border rounded-lg border-cyber-surface/50 bg-transparent hover:border-red-500 hover:text-red-400 active:scale-95" aria-label="Xóa ảnh">
                          <TrashIcon className="w-5 h-5" />
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGuideModalOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
          onClick={() => setIsGuideModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg max-h-full overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/90 backdrop-blur-2xl shadow-cyber-glow-lg"
            onClick={(e) => e.stopPropagation()}
            style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, #00FFFF, #FF00E6) border-box'}}
          >
            <div className="flex items-center justify-between p-4 border-b border-cyber-cyan/20">
              <h2 className="text-xl font-semibold text-cyber-cyan flex items-center gap-2"><InformationCircleIcon className="w-6 h-6"/> Hướng dẫn sử dụng</h2>
              <button 
                onClick={() => setIsGuideModalOpen(false)}
                className="p-2 text-gray-400 transition-colors rounded-full hover:bg-cyber-surface active:scale-95"
                aria-label="Đóng"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 text-cyber-on-surface-secondary">
                <p className="whitespace-pre-wrap leading-relaxed">
{`Cách sử dụng Câu lệnh AUDITION AI cho ai chưa biết:
👉B1 : Tải ảnh nhân vật AU rõ nét lên APP AUDITION AI.
👉B2 : Ấn Sao Chép Prompt và dán vào mô tả ở APP AUDITION AI.
👉B3 : Ấn Tạo ảnh và Chờ đợi kết quả trong 5-10s.

❗Lưu ý: Vì tạo ảnh bằng AI sẽ không tránh được các lỗi như tư thế nhân vật, biểu cảm nhân vật khác với ảnh tải lên,... Hãy thử 7749 lần với mỗi ảnh khác nhau để có kết quả ưng ý nhất.`}
                </p>
            </div>
             <div className="flex justify-end p-4 bg-cyber-surface/50 border-t border-cyber-cyan/20">
                <button
                    type="button"
                    onClick={() => setIsGuideModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-cyan to-blue-500 hover:shadow-cyber-glow active:scale-95"
                >
                    Đã hiểu
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageDetailModal;
