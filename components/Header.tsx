import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon } from './icons/PlusIcon';
import UserMenu from './UserMenu';
import { ImagePrompt, Category } from '../types';
import { Page } from '../App';
import { CrownIcon } from './icons/CrownIcon';
import { HeartIcon } from './icons/HeartIcon';
import { TagIcon } from './icons/TagIcon';

interface HeaderProps {
  onCategorySelect: (id: number | 'all') => void;
  categories: Category[];
  selectedCategoryId: number | 'all';
  onAddNew: () => void;
  onLogin: () => void;
  onSignup: () => void;
  setCurrentPage: (page: Page) => void;
  images: ImagePrompt[];
}

const Header: React.FC<HeaderProps> = ({ onCategorySelect, categories, selectedCategoryId, onAddNew, onLogin, onSignup, setCurrentPage, images }) => {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex flex-col md:flex-row items-center justify-between w-full p-4 border-b bg-cyber-black/70 backdrop-blur-xl border-cyber-pink/20 gap-4 md:gap-0">
      <div className="flex items-center justify-between w-full md:w-auto md:flex-1 md:min-w-0">
        <h1 
            onClick={() => {
              onCategorySelect('all');
              setCurrentPage('home');
            }}
            className="font-oxanium font-semibold text-2xl md:text-3xl tracking-wider text-transparent bg-gradient-to-r from-cyber-pink via-cyber-cyan to-cyber-pink bg-clip-text animate-background-pan cursor-pointer"
            style={{ backgroundSize: '200% auto', textShadow: '0 0 15px rgba(255, 0, 230, 0.4)' }}>
          Prompt Audition AI
        </h1>
        <div className="md:hidden">
          {currentUser ? (
              <UserMenu images={images} setCurrentPage={setCurrentPage} />
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={onLogin} className="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-cyber-on-surface hover:bg-cyber-surface/50 active:scale-95">Đăng nhập</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center w-full pb-1 overflow-x-auto md:w-auto md:pb-0 custom-scrollbar">
        <div className="flex items-center flex-shrink-0 space-x-2">
            <button
              onClick={() => onCategorySelect('all')}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 outline-none focus:ring-2 focus:ring-cyber-pink focus:ring-offset-2 focus:ring-offset-cyber-black ${selectedCategoryId === 'all' ? 'bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white shadow-cyber-glow' : 'bg-cyber-surface text-cyber-on-surface-secondary hover:bg-cyber-surface/50 hover:text-cyber-on-surface'}`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 outline-none focus:ring-2 focus:ring-cyber-pink focus:ring-offset-2 focus:ring-offset-cyber-black ${selectedCategoryId === cat.id ? 'bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white shadow-cyber-glow' : 'bg-cyber-surface text-cyber-on-surface-secondary hover:bg-cyber-surface/50 hover:text-cyber-on-surface'}`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
        <button
            onClick={() => setCurrentPage('support')}
            className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-300 border rounded-lg bg-cyber-surface border-cyber-pink/30 hover:border-cyber-pink/80 hover:bg-cyber-pink/10 focus:outline-none focus:ring-2 focus:ring-cyber-pink active:scale-95"
            aria-label="Ủng hộ dự án"
        >
            <HeartIcon className="w-5 h-5 text-cyber-pink animate-pulse" />
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