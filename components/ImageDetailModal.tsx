import React, { useState, useEffect } from 'react';
import { ImagePrompt, User, Comment, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PencilIcon } from './icons/PencilIcon';
import { HeartIcon } from './icons/HeartIcon';
import { useAuth } from '../contexts/AuthContext';
import { getRankInfo } from '../lib/ranking';
import { ShareIcon } from './icons/ShareIcon';
import { supabase } from '../supabaseClient';

interface ImageDetailModalProps {
  image: ImagePrompt;
  images: ImagePrompt[];
  onClose: () => void;
  onRequestDelete: () => void;
  onRequestEdit: (image: ImagePrompt) => void;
  onCopyPrompt: (prompt: string) => void;
  onToggleLike: (id: number) => void;
  showToast: (message: string) => void;
  currentUser: User | null;
}

const AuthorAvatar: React.FC<{ author: User | undefined | null }> = ({ author }) => {
    if (author?.avatarUrl) {
        return <img src={author.avatarUrl} alt={author.username} className="w-8 h-8 rounded-full object-cover" />;
    }
    return (
        <span className="flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full bg-gradient-to-br from-cyber-pink to-cyber-cyan text-cyber-black">
            {author?.username.charAt(0).toUpperCase() ?? '?'}
        </span>
    );
};

const CommentSection: React.FC<{ comment: Comment }> = ({ comment }) => {
    const { getUserById } = useAuth();
    // Use joined profile data if available, otherwise fall back to getUserById
    const author = comment.profiles ? { username: comment.profiles.username, avatarUrl: comment.profiles.avatarUrl } : getUserById(comment.user_id);
    
    return (
        <div className="flex items-start gap-3 py-3">
            <AuthorAvatar author={author as User} />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-cyber-on-surface">{author?.username ?? 'Người dùng ẩn'}</span>
                    <span className="text-xs text-cyber-on-surface-secondary">{new Date(comment.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="mt-1 text-sm text-cyber-on-surface-secondary">{comment.text}</p>
            </div>
        </div>
    )
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({ 
    image, images, onClose, onRequestDelete, onRequestEdit, onCopyPrompt, onToggleLike, showToast, currentUser 
}) => {
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);

  const { getUserById, ranks } = useAuth();

  useEffect(() => {
    const fetchComments = async () => {
        if (!image.id) return;
        setIsCommentsLoading(true);
        const { data, error } = await supabase
            .from('comments')
            .select('*, profiles!user_id(username, avatarUrl)')
            .eq('image_id', image.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching comments:", error);
            showToast("Không thể tải bình luận.");
        } else {
            setComments(data as any[]);
        }
        setIsCommentsLoading(false);
    };

    fetchComments();
  }, [image.id, showToast]);
  
  const isOwner = currentUser && currentUser.id === image.user_id;
  const isAdmin = currentUser?.role === 'admin';
  const canEditOrDelete = isOwner || isAdmin;

  const author = image.profiles ? { username: image.profiles.username, avatarUrl: image.profiles.avatarUrl } : getUserById(image.user_id);
  const authorRankInfo = getRankInfo(author as User | null, images, ranks);
  const { icon: rankIcon, name: rankName, className: rankClassName, finalColor: rankColor } = authorRankInfo;

  const handleCopyPrompt = () => {
    onCopyPrompt(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!commentText.trim() || !currentUser) {
          if(!currentUser) showToast("Bạn phải đăng nhập để bình luận.");
          return;
      }
      
      const newComment = {
          text: commentText.trim(),
          image_id: image.id,
          user_id: currentUser.id,
      };

      const { data, error } = await supabase.from('comments').insert(newComment).select().single();

      if (error) {
          showToast("Lỗi: Không thể gửi bình luận.");
          console.error(error);
      } else {
          // Add comment to state immediately for better UX
          const newCommentWithProfile: Comment = {
              ...(data as Comment),
              profiles: {
                  username: currentUser.username,
                  avatarUrl: currentUser.avatarUrl || null,
              }
          }
          setComments(prev => [...prev, newCommentWithProfile]);
          setCommentText('');
      }
  };
  
  const hasLiked = currentUser && image.likes.includes(currentUser.id);

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
        onClick={onClose}
      >
        <div 
          className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl md:flex-row bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow-lg"
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
          <div className="relative flex-shrink-0 w-full bg-black md:w-3/5">
            <img src={image.image_url} alt={image.prompt} className="object-contain w-full h-full" />
          </div>
          <div className="flex flex-col flex-grow p-6 space-y-4 overflow-y-auto custom-scrollbar">
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
              <div className="pr-2 mt-2 max-h-20 overflow-y-auto custom-scrollbar">
                <p className="text-base text-cyber-on-surface whitespace-pre-wrap">{image.prompt}</p>
              </div>
              <div className="flex justify-end mt-2">
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
            
             {/* Comments */}
            <div className="pt-4 border-t border-cyber-pink/20">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-cyber-on-surface-secondary">Bình luận ({comments.length})</h3>
                <div className="mt-2 space-y-2 pr-2 overflow-y-auto max-h-40 custom-scrollbar divide-y divide-cyber-pink/10">
                    {isCommentsLoading ? <p className="text-sm italic text-cyber-on-surface-secondary/70">Đang tải bình luận...</p> :
                     comments.length > 0 ? comments.map(c => <CommentSection key={c.id} comment={c} />) : <p className="py-2 italic text-sm text-cyber-on-surface-secondary/70">Chưa có bình luận nào.</p>}
                </div>
                {currentUser && (
                    <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-4">
                        <input 
                            type="text" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Viết bình luận..."
                            className="flex-grow p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition"
                        />
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">Gửi</button>
                    </form>
                )}
            </div>

            <div className="text-sm text-cyber-on-surface-secondary">
              <p><span className="font-semibold">Tạo lúc:</span> {new Date(image.created_at).toLocaleString('vi-VN')}</p>
            </div>
            <div className="flex flex-col gap-3">
              {/* Main Action Button */}
              <div className="flex">
                  <button 
                      onClick={() => onToggleLike(image.id)} 
                      className={`flex items-center justify-center w-full gap-2 py-2.5 px-4 font-medium transition-all duration-300 border-2 rounded-lg active:scale-95
                      ${hasLiked 
                          ? 'bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white border-transparent shadow-cyber-glow' 
                          : 'text-cyber-pink border-cyber-pink bg-transparent hover:bg-cyber-pink/20'
                      }`} 
                      aria-label="Thích ảnh"
                  >
                      <HeartIcon className="w-5 h-5" fill={hasLiked ? 'currentColor' : 'none'} />
                      <span>{hasLiked ? 'Đã thích' : 'Thích'} ({image.likes.length})</span>
                  </button>
              </div>

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
    </>
  );
};

export default ImageDetailModal;