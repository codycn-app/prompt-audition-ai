import React, { useState } from 'react';
import { ImagePrompt, User, Category } from '../types';
import ImageGrid from '../components/ImageGrid';
import { TagIcon } from '../components/icons/TagIcon';

interface CategoriesPageProps {
  categories: Category[];
  images: ImagePrompt[];
  currentUser: User | null;
  onImageClick: (image: ImagePrompt) => void;
}

const CategoriesPage: React.FC<CategoriesPageProps> = ({ categories, images, currentUser, onImageClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const imagesForSelectedCategory = selectedCategory
    ? images.filter(img => img.category_id === selectedCategory.id)
    : [];

  if (selectedCategory) {
    return (
       <div className="max-w-full py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
        <div className="flex items-center mb-6">
          <button onClick={() => setSelectedCategory(null)} className="text-cyber-on-surface-secondary hover:text-cyber-on-surface transition-colors mr-4">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold font-oxanium text-cyber-on-surface">
            Chuyên mục: <span className="text-cyber-cyan">{selectedCategory.name}</span>
          </h1>
        </div>
         <div className="p-4 sm:p-0">
            <ImageGrid 
                images={imagesForSelectedCategory} 
                onImageClick={onImageClick}
                currentUser={currentUser}
            />
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
      <h1 className="text-3xl font-bold font-oxanium text-cyber-on-surface mb-6 text-center sm:text-left">Tất cả Chuyên mục</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className="flex items-center gap-4 p-4 text-left transition-all duration-300 rounded-lg bg-cyber-surface/50 hover:bg-cyber-surface hover:shadow-cyber-glow hover:-translate-y-1"
          >
            <span className="p-3 rounded-lg bg-cyber-black/30 text-cyber-cyan">
              <TagIcon className="w-6 h-6" />
            </span>
            <span className="text-lg font-semibold text-cyber-on-surface">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
