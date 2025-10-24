import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CloseIcon } from './icons/CloseIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { KeyIcon } from './icons/KeyIcon';

interface SettingsModalProps {
  onClose: () => void;
  showToast: (message: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, showToast }) => {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  if (!currentUser) return null;

  // Profile State
  const [username, setUsername] = useState(currentUser.username);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.avatarUrl || null);
  
  // Security State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Kích thước file phải nhỏ hơn 2MB.');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      updateProfile(currentUser.id, { username, avatarUrl: avatarPreview || undefined });
      showToast('Cập nhật thông tin thành công!');
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới không khớp.');
      return;
    }
    if (newPassword.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
    }
    try {
      changePassword(newPassword);
      showToast('Đổi mật khẩu thành công!');
      onClose();
    } catch(err: any) {
      setError(err.message);
    }
  }
  
  const formInputStyle = "w-full p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition";
  
  const tabBaseStyle = "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg";
  const tabActiveStyle = "bg-cyber-surface/80 text-cyber-pink border-b-2 border-cyber-pink";
  const tabInactiveStyle = "text-cyber-on-surface-secondary hover:text-cyber-on-surface";


  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in-scale"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-full flex flex-col overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow-lg"
        onClick={(e) => e.stopPropagation()}
        style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, #FF00E6, #00FFFF) border-box'}}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyber-pink/20">
          <h2 className="text-xl font-semibold">Cài đặt Tài khoản</h2>
          <button onClick={onClose} className="p-2 text-gray-400 transition-colors rounded-full hover:bg-cyber-surface active:scale-95" aria-label="Đóng">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="border-b border-cyber-pink/20 px-4 pt-2">
            <div className="flex -mb-px">
                <button className={`${tabBaseStyle} ${activeTab === 'profile' ? tabActiveStyle : tabInactiveStyle}`} onClick={() => setActiveTab('profile')}>
                    <UserCircleIcon className="w-5 h-5"/>
                    Thông tin cá nhân
                </button>
                <button className={`${tabBaseStyle} ${activeTab === 'security' ? tabActiveStyle : tabInactiveStyle}`} onClick={() => setActiveTab('security')}>
                    <KeyIcon className="w-5 h-5"/>
                    Bảo mật
                </button>
            </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-4 animate-fade-in-scale">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-cyber-on-surface">Ảnh đại diện</label>
                        <div className="flex items-center gap-4">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center w-20 h-20 rounded-full bg-cyber-surface text-3xl">
                                  <UserCircleIcon className="w-16 h-16 text-cyber-on-surface-secondary"/>
                                </span>
                            )}
                            <label htmlFor="avatar-upload" className="px-4 py-2 text-sm font-medium transition-colors rounded-lg cursor-pointer text-cyber-on-surface bg-cyber-surface/50 hover:bg-cyber-surface active:scale-95">
                                Tải ảnh lên
                            </label>
                            <input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="username-settings" className="block mb-2 text-sm font-medium text-cyber-on-surface">Tên hiển thị</label>
                        <input id="username-settings" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={formInputStyle} required/>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-cyber-on-surface-secondary">Email</label>
                      <p className="p-2.5 rounded-lg bg-cyber-surface/50 text-cyber-on-surface-secondary">{currentUser.email}</p>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">Lưu thay đổi</button>
                    </div>
                </form>
            )}

            {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-fade-in-scale">
                    <div>
                        <label htmlFor="old-password" className="block mb-2 text-sm font-medium text-cyber-on-surface">Mật khẩu cũ</label>
                        <input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={formInputStyle} placeholder="••••••••" required />
                    </div>
                    <div>
                        <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-cyber-on-surface">Mật khẩu mới</label>
                        <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={formInputStyle} placeholder="••••••••" required />
                    </div>
                    <div>
                        <label htmlFor="confirm-new-password" className="block mb-2 text-sm font-medium text-cyber-on-surface">Xác nhận mật khẩu mới</label>
                        <input id="confirm-new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={formInputStyle} placeholder="••••••••" required />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                     <div className="flex justify-end pt-2">
                        <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">Đổi mật khẩu</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;