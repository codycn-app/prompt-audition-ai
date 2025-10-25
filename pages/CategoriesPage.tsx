import React, { useState, useMemo } from 'react';
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
    ? images.filter(img => img.categories && img.categories.some(cat => cat.id === selectedCategory.id))
    : [];

  const categoryImages = useMemo(() => {
    const imageMap = new Map<number, string>();
    // Images are presorted newest first from App.tsx
    for (const image of images) {
        if (image.categories) {
            for (const category of image.categories) {
                if (!imageMap.has(category.id)) {
                    imageMap.set(category.id, image.image_url);
                }
            }
        }
    }
    return imageMap;
  }, [images]);

  if (selectedCategory) {
    return (
       <div className="max-w-full py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
        <div className="flex items-center mb-6">
          <button onClick={() => setSelectedCategory(null)} className="text-cyber-on-surface-secondary hover:text-cyber-on-surface transition-colors mr-4 p-2 rounded-full hover:bg-cyber-surface">
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
      <h1 className="text-3xl font-bold font-oxanium text-cyber-on-surface mb-6 text-center sm:text-left">Tất cả Chuyên mục</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => {
          const latestImage = categoryImages.get(category.id);
          return (
            <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="relative block w-full overflow-hidden transition-all duration-300 rounded-xl aspect-w-4 aspect-h-3 group bg-cyber-surface hover:shadow-cyber-glow hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-cyber-pink focus:ring-offset-2 focus:ring-offset-cyber-black"
            >
                {latestImage ? (
                    <img src={latestImage} alt={category.name} className="absolute inset-0 object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-cyber-black">
                        <TagIcon className="w-12 h-12 text-cyber-surface" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-white drop-shadow-lg">
                        <span className="p-2 rounded-md bg-cyber-cyan/20 backdrop-blur-sm">
                           <TagIcon className="w-5 h-5 text-cyber-cyan" />
                        </span>
                        {category.name}
                    </h3>
                </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;