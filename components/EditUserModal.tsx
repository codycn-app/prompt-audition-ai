import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  showToast: (message: string) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, showToast }) => {
  const { updateUserByAdmin, currentUser } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState(user.role);
  const [customTitle, setCustomTitle] = useState(user.customTitle || '');
  const [customTitleColor, setCustomTitleColor] = useState(user.customTitleColor || '#E0E0E0');
  const [newPassword, setNewPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
  const [error, setError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Kích thước file phải nhỏ hơn 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const updatePayload: Partial<Pick<User, 'username' | 'role' | 'customTitle' | 'customTitleColor' | 'avatarUrl' | 'password'>> = {
          username,
          role,
          avatarUrl: avatarPreview || '', // Use empty string to clear avatar
      };

      if (customTitle.trim()) {
        updatePayload.customTitle = customTitle;
        updatePayload.customTitleColor = customTitleColor;
      } else {
        updatePayload.customTitle = '';
        updatePayload.customTitleColor = '';
      }
      
      if (newPassword.trim()) {
        updatePayload.password = newPassword;
      }
      
      updateUserByAdmin(user.id, updatePayload);
      showToast(`Đã cập nhật người dùng ${username}!`);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleResetTitle = () => {
    setCustomTitle('');
    setCustomTitleColor('#E0E0E0');
  };

  const formInputStyle = "w-full p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition";
  const isEditingSelf = currentUser?.id === user.id;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md max-h-full overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow-lg"
        onClick={(e) => e.stopPropagation()}
        style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, #FF00E6, #00FFFF) border-box'}}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyber-pink/20">
          <h2 className="text-xl font-semibold">Chỉnh sửa Người dùng</h2>
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
            <label className="block mb-2 text-sm font-medium text-cyber-on-surface">Ảnh đại diện</label>
            <div className="flex items-center gap-4">
                {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="object-cover w-16 h-16 rounded-full" />
                ) : (
                    <span className="flex items-center justify-center w-16 h-16 rounded-full bg-cyber-surface">
                        <UserCircleIcon className="w-14 h-14 text-cyber-on-surface-secondary"/>
                    </span>
                )}
                <label htmlFor="avatar-admin-upload" className="px-4 py-2 text-sm font-medium transition-colors rounded-lg cursor-pointer text-cyber-on-surface bg-cyber-surface/50 hover:bg-cyber-surface active:scale-95">
                    Thay đổi
                </label>
                <input id="avatar-admin-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} />
            </div>
          </div>
          <div>
            <label htmlFor="username-edit" className="block mb-2 text-sm font-medium text-cyber-on-surface">Tên tài khoản</label>
            <input id="username-edit" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={formInputStyle} required/>
          </div>
          <div>
            <label htmlFor="password-edit" className="block mb-2 text-sm font-medium text-cyber-on-surface">Mật khẩu mới</label>
            <input id="password-edit" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={formInputStyle} placeholder="Để trống để giữ nguyên"/>
          </div>
          <div>
            <label htmlFor="role-select" className="block mb-2 text-sm font-medium text-cyber-on-surface">Vai trò</label>
            <select id="role-select" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')} className={formInputStyle} disabled={isEditingSelf}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {isEditingSelf && <p className="mt-1 text-xs text-cyber-on-surface-secondary">Không thể thay đổi vai trò của chính mình.</p>}
          </div>
          <hr className="border-cyber-pink/10"/>
          <div>
            <label htmlFor="custom-title" className="block mb-2 text-sm font-medium text-cyber-on-surface">Biệt danh tùy chỉnh</label>
            <input id="custom-title" type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className={formInputStyle} placeholder="Để trống để dùng phân cấp mặc định"/>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-grow">
                <label htmlFor="custom-color" className="block mb-2 text-sm font-medium text-cyber-on-surface">Màu sắc biệt danh</label>
                <input id="custom-color" type="text" value={customTitleColor} onChange={(e) => setCustomTitleColor(e.target.value)} className={formInputStyle} placeholder="#E0E0E0" />
            </div>
            <div className="self-end">
                <input type="color" value={customTitleColor} onChange={(e) => setCustomTitleColor(e.target.value)} className="w-12 h-10 p-1 bg-cyber-surface border rounded-lg cursor-pointer border-cyber-pink/20" />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-between pt-2">
            <button type="button" onClick={handleResetTitle} className="px-5 py-2.5 text-sm font-medium text-cyber-on-surface bg-cyber-surface/50 rounded-lg hover:bg-cyber-surface transition active:scale-95">
              Reset Biệt danh
            </button>
            <div className="flex space-x-3">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-cyber-on-surface bg-cyber-surface/50 rounded-lg hover:bg-cyber-surface transition active:scale-95">Hủy</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">Lưu</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditUserModal;