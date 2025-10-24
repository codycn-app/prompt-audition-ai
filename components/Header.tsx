import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import UserMenu from './UserMenu';
import { ImagePrompt } from '../types';
import { Page } from '../App';
import { CrownIcon } from './icons/CrownIcon';
import { HeartIcon } from './icons/HeartIcon';

interface HeaderProps {
  onSearch: (term: string) => void;
  onAddNew: () => void;
  onLogin: () => void;
  onSignup: () => void;
  setCurrentPage: (page: Page) => void;
  images: ImagePrompt[];
}

const Header: React.FC<HeaderProps> = ({ onSearch, onAddNew, onLogin, onSignup, setCurrentPage, images }) => {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full p-4 border-b bg-cyber-black/70 backdrop-blur-xl border-cyber-pink/20">
      <div className="flex-1 min-w-0">
        <h1 
            onClick={() => setCurrentPage('home')}
            className="font-oxanium font-semibold text-2xl md:text-3xl tracking-wider text-transparent bg-gradient-to-r from-cyber-pink via-cyber-cyan to-cyber-pink bg-clip-text animate-background-pan cursor-pointer"
            style={{ backgroundSize: '200% auto', textShadow: '0 0 15px rgba(255, 0, 230, 0.4)' }}>
          Prompt Audition AI
        </h1>
      </div>
      <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-cyber-on-surface-secondary" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full max-w-xs py-2 pl-10 pr-4 transition-colors duration-300 border rounded-lg bg-cyber-surface border-cyber-pink/20 placeholder-cyber-on-surface-secondary text-cyber-on-surface focus:outline-none focus:ring-2 focus:ring-cyber-pink focus:border-cyber-pink"
          />
        </div>
        
        <button
            onClick={() => setCurrentPage('leaderboard')}
            className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-300 border rounded-lg bg-cyber-surface border-rank-master/30 hover:border-rank-master/80 hover:bg-rank-master/10 focus:outline-none focus:ring-2 focus:ring-rank-master active:scale-95"
            aria-label="Bảng xếp hạng"
        >
            <CrownIcon className="w-5 h-5 text-rank-master animate-icon-glow" />
            <span className="text-sm font-semibold text-rank-master animate-text-glow">BXH</span>
        </button>

        <button
            onClick={() => setCurrentPage('support')}
            className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-300 border rounded-lg bg-cyber-surface border-cyber-pink/30 hover:border-cyber-pink/80 hover:bg-cyber-pink/10 focus:outline-none focus:ring-2 focus:ring-cyber-pink active:scale-95"
            aria-label="Ủng hộ dự án"
        >
            <HeartIcon className="w-5 h-5 text-cyber-pink animate-pulse" />
            <span className="text-sm font-semibold text-cyber-pink">Ủng hộ</span>
        </button>
        
        {currentUser ? (
          <>
            <button
              onClick={onAddNew}
              className="relative inline-flex items-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 border-2 border-transparent rounded-lg shadow-lg outline-none bg-gradient-to-r from-cyber-pink to-cyber-cyan group hover:shadow-cyber-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-black focus:ring--pink active:scale-95"
            >
              <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
              <span>Thêm mới</span>
            </button>
            <UserMenu images={images} setCurrentPage={setCurrentPage} />
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <button onClick={onLogin} className="px-5 py-2.5 text-sm font-medium transition-colors rounded-lg text-cyber-on-surface hover:bg-cyber-surface/50 active:scale-95">Đăng nhập</button>
            <button onClick={onSignup} className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">Đăng ký</button>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;