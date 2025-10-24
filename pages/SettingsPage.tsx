import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { KeyIcon } from '../components/icons/KeyIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import RankManagement from '../components/RankManagement';
import { supabase } from '../supabaseClient';
import { Category } from '../types';
import CategoryManagement from '../components/CategoryManagement';
import { TagIcon } from '../components/icons/TagIcon';

interface SettingsPageProps {
  showToast: (message: string) => void;
  categories: Category[];
  onUpdateCategories: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ showToast, categories, onUpdateCategories }) => {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'rank-management' | 'category-management'>('profile');

  if (!currentUser) return null;

  // Profile State
  const [username, setUsername] = useState(currentUser.username);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
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
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let avatarUrlToSave = currentUser.avatarUrl;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        // Definitive fix: The path must be user-specific to pass RLS policies.
        // The RLS policy likely expects the folder to be the user's ID.
        const filePath = `${currentUser.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL and add a timestamp to bust cache
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrlToSave = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      }
      
      await updateProfile(currentUser.id, { username, avatarUrl: avatarUrlToSave });
      showToast('Cập nhật thông tin thành công!');
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      await changePassword(newPassword);
      showToast('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch(err: any) {
      setError(err.message);
    }
  }
  
  const formInputStyle = "w-full p-2.5 bg-cyber-surface border border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface rounded-lg focus:ring-cyber-pink focus:border-cyber-pink transition";
  
  const tabBaseStyle = "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2";
  const tabActiveStyle = "text-cyber-pink border-cyber-pink";
  const tabInactiveStyle = "text-cyber-on-surface-secondary hover:text-cyber-on-surface border-transparent";


  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
        <h1 className="text-3xl font-bold font-oxanium text-cyber-on-surface mb-6">Cài đặt</h1>
        <div 
            className="w-full flex flex-col overflow-hidden rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow"
            style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, rgba(255, 0, 230, 0.4), rgba(0, 255, 255, 0.4)) border-box'}}
        >
            <div className="border-b border-cyber-pink/20 px-4">
                <div className="flex -mb-px overflow-x-auto">
                    <button className={`${tabBaseStyle} ${activeTab === 'profile' ? tabActiveStyle : tabInactiveStyle}`} onClick={() => { setActiveTab('profile'); setError(''); }}>
                        <UserCircleIcon className="w-5 h-5"/>
                        Thông tin
                    </button>
                    <button className={`${tabBaseStyle} ${activeTab === 'security' ? tabActiveStyle : tabInactiveStyle}`} onClick={() => { setActiveTab('security'); setError(''); }}>
                        <KeyIcon className="w-5 h-5"/>
                        Bảo mật
                    </button>
                    {currentUser.role === 'admin' && (
                        <>
                         <button className={`${tabBaseStyle} ${activeTab === 'category-management' ? tabActiveStyle : tabInactiveStyle}`} onClick={() => { setActiveTab('category-management'); setError(''); }}>
                            <TagIcon className="w-5 h-5"/>
                            Chuyên mục
                        </button>
                         <button className={`${tabBaseStyle} ${activeTab === 'rank-management' ? tabActiveStyle : tabInactiveStyle}`} onClick={() => { setActiveTab('rank-management'); setError(''); }}>
                            <ShieldCheckIcon className="w-5 h-5"/>
                            Cấp bậc
                        </button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-6">
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-6 animate-fade-in-scale">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-cyber-on-surface">Ảnh đại diện</label>
                            <div className="flex items-center gap-4">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar Preview" className="object-cover w-20 h-20 rounded-full" />
                                ) : (
                                    <span className="flex items-center justify-center w-20 h-20 text-3xl rounded-full bg-cyber-surface">
                                    <UserCircleIcon className="w-16 h-16 text-cyber-on-surface-secondary"/>
                                    </span>
                                )}
                                <label htmlFor="avatar-upload" className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg cursor-pointer text-cyber-on-surface bg-cyber-surface hover:bg-cyber-surface/50 active:scale-95 border-cyber-pink/20">
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
                        <label className="block mb-2 text-sm font-medium text-cyber-on-surface-secondary">Email (không thể thay đổi)</label>
                        <p className="p-2.5 rounded-lg bg-cyber-black/20 text-cyber-on-surface-secondary">{currentUser.email}</p>
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

                {activeTab === 'rank-management' && (
                    <RankManagement showToast={showToast} />
                )}

                {activeTab === 'category-management' && (
                    <CategoryManagement 
                        categories={categories}
                        showToast={showToast}
                        onUpdate={onUpdateCategories}
                    />
                )}
            </div>
        </div>
    </div>
  );
};

export default SettingsPage;