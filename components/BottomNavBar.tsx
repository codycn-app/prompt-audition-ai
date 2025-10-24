import React from 'react';
import { Page } from '../App';
import { HomeIcon } from './icons/HomeIcon';
import { CrownIcon } from './icons/CrownIcon';
import { PlusIcon } from './icons/PlusIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { useAuth } from '../contexts/AuthContext';
import { TagIcon } from './icons/TagIcon';

interface BottomNavBarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onAddNew: () => void;
  onLogin: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentPage, setCurrentPage, onAddNew, onLogin }) => {
  const { currentUser } = useAuth();

  const handleNavigation = (page: Page) => {
    if (!currentUser && (page === 'profile' || page === 'categories')) {
        onLogin();
    } else {
        setCurrentPage(page);
    }
  };

  const NavButton: React.FC<{ page: Page, label: string, icon: React.ReactNode }> = ({ page, label, icon }) => {
    const isActive = currentPage === page;
    return (
      <button 
        onClick={() => handleNavigation(page)} 
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-cyber-pink' : 'text-cyber-on-surface-secondary hover:text-cyber-on-surface'}`}
      >
        {icon}
        <span className="text-[10px] font-medium mt-1">{label}</span>
      </button>
    );
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t md:hidden bg-cyber-black/80 backdrop-blur-xl border-cyber-pink/20">
      <div className="flex items-center justify-around h-full">
        <NavButton page="home" label="Trang chủ" icon={<HomeIcon className="w-6 h-6" />} />
        <NavButton page="leaderboard" label="BXH" icon={<CrownIcon className="w-6 h-6" />} />
        
        <button 
          onClick={currentUser ? onAddNew : onLogin}
          className="flex items-center justify-center w-16 h-16 -mt-8 transition-transform duration-300 rounded-full shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-90"
          aria-label="Thêm mới"
        >
          <PlusIcon className="w-8 h-8 text-white" />
        </button>

        <NavButton page="categories" label="Chuyên mục" icon={<TagIcon className="w-6 h-6" />} />
        <NavButton page="profile" label="Cá nhân" icon={<UserCircleIcon className="w-6 h-6" />} />
      </div>
    </div>
  );
};

export default BottomNavBar;