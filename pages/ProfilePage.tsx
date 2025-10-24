import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ImagePrompt } from '../types';
import { getRankInfo } from '../lib/ranking';
import { Page } from '../App';
import { GearIcon } from '../components/icons/GearIcon';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';
import { LogoutIcon } from '../components/icons/LogoutIcon';
import { HeartIcon } from '../components/icons/HeartIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';

interface ProfilePageProps {
  images: ImagePrompt[];
  setCurrentPage: (page: Page) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ images, setCurrentPage }) => {
  const { currentUser, logout, ranks } = useAuth();

  if (!currentUser) {
    // This page should not be accessible when logged out, but as a safeguard.
    return null; 
  }

  const rankInfo = getRankInfo(currentUser, images, ranks);

  // Fix: Explicitly type `menuItems` to ensure `item.page` is of type `Page`.
  const menuItems: { label: string; icon: React.ReactNode; page: Page; requiredRole: Array<'user' | 'admin'> }[] = [
    { label: 'Ảnh đã thích', icon: <HeartIcon className="w-5 h-5"/>, page: 'liked-images', requiredRole: ['user', 'admin'] },
    { label: 'Cài đặt Tài khoản', icon: <GearIcon className="w-5 h-5"/>, page: 'settings', requiredRole: ['user', 'admin'] },
    { label: 'Quản lý Cấp bậc', icon: <ShieldCheckIcon className="w-5 h-5"/>, page: 'settings', requiredRole: ['admin'] },
    { label: 'Quản lý Người dùng', icon: <UserGroupIcon className="w-5 h-5"/>, page: 'user-management', requiredRole: ['admin'] },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
        {/* User Info Card */}
        <div 
            className="flex flex-col items-center p-6 mb-8 overflow-hidden text-center rounded-xl shadow-2xl bg-cyber-surface/80 backdrop-blur-2xl shadow-cyber-glow"
            style={{border: '1px solid transparent', background: 'linear-gradient(#1A1A1A, #1A1A1A) padding-box, linear-gradient(120deg, rgba(255, 0, 230, 0.4), rgba(0, 255, 255, 0.4)) border-box'}}
        >
            {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt={currentUser.username} className="object-cover w-24 h-24 rounded-full border-2 border-cyber-pink/50" />
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
        
        {/* Menu List */}
        <div className="space-y-3">
             {menuItems.map(item => {
                if (!item.requiredRole.includes(currentUser.role)) return null;
                // Special handling for rank management to navigate within settings page
                const handleItemClick = () => {
                    if (item.label === 'Quản lý Cấp bậc') {
                        // Navigate to settings and potentially signal which tab to open
                        // For now, it just goes to settings page. The component itself handles tabs.
                        setCurrentPage('settings');
                    } else {
                        setCurrentPage(item.page);
                    }
                }
                return (
                    <button 
                        key={item.label}
                        onClick={handleItemClick}
                        className="w-full flex items-center gap-4 p-4 text-left transition-colors rounded-lg bg-cyber-surface/50 hover:bg-cyber-surface"
                    >
                        <span className="p-2 rounded-full bg-cyber-black/30 text-cyber-cyan">{item.icon}</span>
                        <span className="flex-grow text-base font-medium text-cyber-on-surface">{item.label}</span>
                    </button>
                )
             })}
             
             <button 
                onClick={logout}
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