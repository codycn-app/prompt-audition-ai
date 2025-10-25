import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ImagePrompt } from '../types';
import { getRankInfo } from '../lib/ranking';
import { Page } from '../App';
import { GearIcon } from '../components/icons/GearIcon';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';
import { LogoutIcon } from '../components/icons/LogoutIcon';
import { HeartIcon } from '../components/icons/HeartIcon';
import { TagIcon } from '../components/icons/TagIcon';
import { useToast } from '../contexts/ToastContext';
import ExpBar from '../components/ExpBar'; // Import the new component

interface ProfilePageProps {
  images: ImagePrompt[];
  setCurrentPage: (page: Page) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ images, setCurrentPage }) => {
  const { currentUser, logout, ranks } = useAuth();
  const { showToast } = useToast();

  if (!currentUser) {
    // This page should not be accessible when logged out, but as a safeguard.
    return null; 
  }

  const handleLogout = async () => {
    await logout();
    showToast('Đã đăng xuất tài khoản.', 'success');
    setCurrentPage('home'); // Redirect to home for better UX
  };

  const rankInfo = getRankInfo(currentUser, images, ranks);

  const menuItems: { label: string; icon: React.ReactNode; page: Page; requiredRole: Array<'user' | 'admin'> }[] = [
    { label: 'Chuyên mục', icon: <TagIcon className="w-5 h-5"/>, page: 'categories', requiredRole: ['user', 'admin'] },
    { label: 'Ảnh đã thích', icon: <HeartIcon className="w-5 h-5"/>, page: 'liked-images', requiredRole: ['user', 'admin'] },
    { label: 'Cài đặt Tài khoản', icon: <GearIcon className="w-5 h-5"/>, page: 'settings', requiredRole: ['user', 'admin'] },
    { label: 'Quản lý Người dùng', icon: <UserGroupIcon className="w-5 h-5"/>, page: 'user-management', requiredRole: ['admin'] },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
        {/* User Info Card */}
        <div 
            className="flex flex-col items-center p-6 mb-8 overflow-hidden text-center rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow"
            style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, rgba(255, 0, 230, 0.4), rgba(0, 255, 255, 0.4)) border-box'}}
        >
            {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.username} className="object-cover w-24 h-24 rounded-full border-2 border-cyber-pink/50" />
            ) : (
                <span className="flex items-center justify-center w-24 h-24 text-4xl font-bold rounded-full bg-gradient-to-br from-cyber-pink to-cyber-cyan text-cyber-black">
                    {currentUser.username.charAt(0).toUpperCase()}
                </span>
            )}
            <h1 className={`mt-4 text-2xl font-bold ${rankInfo.className}`} style={{ color: rankInfo.finalColor }}>
                {currentUser.username}
            </h1>
            <div className="flex items-center gap-1.5 mt-1" style={{ color: rankInfo.finalColor }}>
                {rankInfo.icon && <img src={rankInfo.icon} alt={rankInfo.name} className="w-4 h-4" />}
                <span className="text-sm">{rankInfo.name}</span>
            </div>
            <p className="mt-2 text-sm text-cyber-on-surface-secondary">{currentUser.email}</p>
        </div>
        
        {/* EXP Bar */}
        <div className="mb-8">
            <ExpBar currentUser={currentUser} ranks={ranks} />
        </div>

        {/* How to earn EXP card */}
        <div className="p-6 mb-8 rounded-xl bg-cyber-surface/80">
            <h2 className="text-lg font-bold text-cyber-on-surface mb-3 font-oxanium">Làm sao để tăng EXP?</h2>
            <ul className="space-y-2 text-sm list-disc list-inside text-cyber-on-surface-secondary">
                <li><span className="font-semibold text-cyber-cyan">+50 EXP</span> cho mỗi ảnh bạn đăng tải.</li>
                <li><span className="font-semibold text-cyber-cyan">+10 EXP</span> cho mỗi bình luận của bạn.</li>
                <li><span className="font-semibold text-cyber-cyan">+5 EXP</span> cho mỗi lượt thích ảnh.</li>
                <li><span className="font-semibold text-cyber-cyan">+20 EXP</span> mỗi khi bạn cập nhật thông tin cá nhân (tên, ảnh đại diện).</li>
                <li><span className="font-semibold text-cyber-cyan">+1 EXP</span> cho mỗi phút bạn hoạt động trên trang.</li>
            </ul>
        </div>

        {/* Menu List */}
        <div className="space-y-3">
             {menuItems.map(item => {
                if (!item.requiredRole.includes(currentUser.role)) return null;
                return (
                    <button 
                        key={item.label}
                        onClick={() => setCurrentPage(item.page)}
                        className="w-full flex items-center gap-4 p-4 text-left transition-colors rounded-lg bg-cyber-surface/50 hover:bg-cyber-surface"
                    >
                        <span className="p-2 rounded-full bg-cyber-black/30 text-cyber-cyan">{item.icon}</span>
                        <span className="flex-grow text-base font-medium text-cyber-on-surface">{item.label}</span>
                    </button>
                )
             })}
             
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 text-left transition-colors rounded-lg bg-cyber-surface/50 hover:bg-cyber-surface"
            >
                <span className="p-2 rounded-full bg-cyber-black/30 text-rank-admin">{<LogoutIcon className="w-5 h-5"/>}</span>
                <span className="flex-grow text-base font-medium text-cyber-on-surface">Đăng xuất</span>
            </button>
        </div>
    </div>
  );
};

export default ProfilePage;