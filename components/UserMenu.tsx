import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { GearIcon } from './icons/GearIcon';
import { ImagePrompt } from '../types';
import { getRankInfo } from '../lib/ranking';
import { Page } from '../App';
import { HeartIcon } from './icons/HeartIcon';
import { TagIcon } from './icons/TagIcon';

interface UserMenuProps {
  images: ImagePrompt[];
  setCurrentPage: (page: Page) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ images, setCurrentPage }) => {
  const { currentUser, logout, ranks } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentUser) return null;
  
  const rankInfo = getRankInfo(currentUser, images, ranks);
  const { name: rankName, className: rankClassName, finalColor: rankColor } = rankInfo;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-3 transition-opacity hover:opacity-80">
            <div className="flex-shrink-0">
                {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.username} className="object-cover w-10 h-10 rounded-full" />
                ) : (
                    <span className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full bg-gradient-to-br from-cyber-pink to-cyber-cyan text-cyber-black">
                        {currentUser.username.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <div className="hidden sm:flex flex-col items-start">
                <p className={`text-sm font-semibold ${rankClassName}`} style={{color: rankColor}}>{currentUser.username}</p>
                <p className="text-xs text-cyber-on-surface-secondary" style={{color: rankColor}}>{rankName}</p>
            </div>
        </button>
        
        {isMenuOpen && (
          <div className="absolute right-0 w-64 mt-2 origin-top-right rounded-lg shadow-lg bg-cyber-surface/90 backdrop-blur-xl ring-1 ring-cyber-pink/20 animate-fade-in-scale">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-cyber-pink/10">
                <p className="text-sm font-semibold text-cyber-on-surface">
                  {currentUser.username}
                </p>
                <p className="text-xs text-cyber-on-surface-secondary">
                  {currentUser.email}
                </p>
              </div>
              <button
                onClick={() => { setCurrentPage('categories'); setIsMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors text-cyber-on-surface hover:bg-cyber-pink/10"
              >
                <TagIcon className="w-5 h-5 mr-3" />
                Chuyên mục
              </button>
              <button
                onClick={() => { setCurrentPage('liked-images'); setIsMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors text-cyber-on-surface hover:bg-cyber-pink/10"
              >
                <HeartIcon className="w-5 h-5 mr-3" />
                Ảnh đã thích
              </button>
              <button
                onClick={() => { setCurrentPage('settings'); setIsMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors text-cyber-on-surface hover:bg-cyber-pink/10"
              >
                <GearIcon className="w-5 h-5 mr-3" />
                Cài đặt
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => { setCurrentPage('user-management'); setIsMenuOpen(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors text-cyber-on-surface hover:bg-cyber-pink/10"
                >
                  <UserGroupIcon className="w-5 h-5 mr-3" />
                  Quản lý người dùng
                </button>
              )}
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors text-cyber-on-surface hover:bg-cyber-pink/10"
              >
                <LogoutIcon className="w-5 h-5 mr-3" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserMenu;
