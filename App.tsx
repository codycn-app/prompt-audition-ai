import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ImagePrompt, Comment, User, Category } from './types';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import ImageGrid from './components/ImageGrid';
import ImageDetailModal from './components/ImageDetailModal';
import AddImageModal from './components/AddImageModal';
import EditImageModal from './components/EditImageModal';
import ConfirmationModal from './components/ConfirmationModal';
import Toast from './components/Toast';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import LikedImagesPage from './pages/LikedImagesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ImageGridSkeleton from './components/ImageGridSkeleton';
import BottomNavBar from './components/BottomNavBar';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import CategoriesPage from './pages/CategoriesPage';
import { supabase } from './supabaseClient';


export type Page = 'home' | 'settings' | 'user-management' | 'liked-images' | 'leaderboard' | 'profile' | 'support' | 'categories';

const App: React.FC = () => {
  const [images, setImages] = useState<ImagePrompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, users } = useAuth();
  
  const [selectedImage, setSelectedImage] = useState<ImagePrompt | null>(null);
  const [imageToEdit, setImageToEdit] = useState<ImagePrompt | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  
  const [imageToDelete, setImageToDelete] = useState<ImagePrompt | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Definitive fix for theme initialization.
  // This runs only once and ensures a default theme is set if none exists.
  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    
    // Fetch categories first
    const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        showToast('Lỗi: Không thể tải danh sách chuyên mục.');
    } else {
        setCategories(categoriesData as Category[]);
    }

    // Definitive fix: Use direct query to bypass failing RPC and schema issues.
    // This assumes relationships are set up in Supabase.
    const { data: imagesData, error: imagesError } = await supabase
      .from('images')
      .select(`
        *,
        profiles ( username, avatar_url ),
        categories ( id, name ),
        comments ( count )
      `)
      .order('created_at', { ascending: false });

    if (imagesError) {
        console.error('Error fetching images:', imagesError);
        showToast('Lỗi nghiêm trọng: Không thể tải dữ liệu ảnh.');
        setIsLoading(false);
        return;
    }

    // Transform the data to match the ImagePrompt type, especially the comments_count.
    const transformedImages = imagesData.map((img: any) => ({
        ...img,
        comments_count: Array.isArray(img.comments) && img.comments.length > 0 ? img.comments[0].count : 0,
        categories: img.categories || [],
    }));

    setImages(transformedImages as ImagePrompt[]);
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  const findImageById = useCallback((id: number) => {
    return images.find(img => img.id === id);
  }, [images]);

  // Handle deep linking from URL
  useEffect(() => {
    if (isLoading) return; // Wait for images to be loaded
    const urlParams = new URLSearchParams(window.location.search);
    const imageIdStr = urlParams.get('image');
    if (imageIdStr) {
      const imageId = parseInt(imageIdStr, 10);
      const imageToOpen = findImageById(imageId);
      if (imageToOpen) {
        setSelectedImage(imageToOpen);
      } else {
        showToast("Không tìm thấy ảnh được chia sẻ.");
        const url = new URL(window.location.href);
        url.searchParams.delete('image');
        window.history.replaceState({}, '', url.pathname);
      }
    }
  }, [isLoading, findImageById, showToast]);


  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showToast('Đã sao chép câu lệnh!');
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Đã sao chép liên kết chia sẻ!');
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('image')) {
        url.searchParams.delete('image');
        window.history.replaceState({}, '', url.pathname);
    }
  };

  const handleSelectImage = useCallback(async (image: ImagePrompt) => {
    setSelectedImage(image);
    
    const newViews = (image.views || 0) + 1;
    // Update view count in DB
    const { error } = await supabase
      .from('images')
      .update({ views: newViews })
      .eq('id', image.id);
    
    if (!error) {
        // Update view count in local state for immediate feedback
        setImages(prevImages => 
            prevImages.map(img => 
                img.id === image.id ? { ...img, views: newViews } : img
            )
        );
    }

     // Update URL to reflect the selected image
    const url = new URL(window.location.href);
    url.searchParams.set('image', image.id.toString());
    window.history.pushState({}, '', url);
  }, []);

  const filteredImages = useMemo(() => {
    if (selectedCategoryId === 'all') return images;
    // Corrected logic for many-to-many relationship
    return images.filter(image => image.categories && image.categories.some(cat => cat.id === selectedCategoryId));
  }, [images, selectedCategoryId]);
  
  // Simplified handler: The modal does the heavy lifting via RPC. This just shows a toast and refreshes data.
  const handleAddImage = useCallback(async () => {
    setIsAddModalOpen(false);
    showToast('Đã thêm ảnh mới thành công!');
    await fetchInitialData();
  }, [fetchInitialData, showToast]);
  
  // Simplified handler: The modal does the heavy lifting via RPC. This just shows a toast and refreshes data.
  const handleUpdateImage = useCallback(async () => {
    setImageToEdit(null);
    showToast('Đã cập nhật ảnh thành công!');
    await fetchInitialData();
  }, [fetchInitialData, showToast]);

  const handleRequestDelete = useCallback((image: ImagePrompt) => {
    if (!currentUser || (image.user_id !== currentUser.id && currentUser.role !== 'admin')) {
        showToast('Bạn không có quyền xóa ảnh này.');
        return;
    }
    setImageToDelete(image);
  }, [currentUser, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!imageToDelete) return;

    const bucketName = 'images';

    if (imageToDelete.imageUrl) {
        const imagePath = imageToDelete.imageUrl.split(`/${bucketName}/`)[1];
        if (imagePath) {
            await supabase.storage.from(bucketName).remove([imagePath]);
        }
    }
    
    const { error } = await supabase.from('images').delete().eq('id', imageToDelete.id);

    if (error) {
        showToast('Lỗi: không thể xóa ảnh.');
        console.error(error);
    } else {
        showToast('Đã xóa ảnh thành công!');
        if (selectedImage && selectedImage.id === imageToDelete.id) {
            handleCloseModal();
        }
        setImages(prev => prev.filter(image => image.id !== imageToDelete.id));
    }
    setImageToDelete(null);
  }, [imageToDelete, selectedImage, showToast]);
  
  const handleToggleLike = useCallback(async (imageId: number) => {
      if (!currentUser) {
          showToast('Bạn phải đăng nhập để thích ảnh!');
          return;
      }

      const image = findImageById(imageId);
      if (!image) return;

      const hasLiked = image.likes.includes(currentUser.id);
      const newLikes = hasLiked
          ? image.likes.filter(id => id !== currentUser.id)
          : [...image.likes, currentUser.id];

      const { error } = await supabase
        .from('images')
        .update({ likes: newLikes })
        .eq('id', imageId);

      if (error) {
          showToast('Đã có lỗi xảy ra.');
          console.error(error);
      } else {
          setImages(prevImages => 
            prevImages.map(img => img.id === imageId ? { ...img, likes: newLikes } : img)
          );
          if (selectedImage && selectedImage.id === imageId) {
            setSelectedImage(prev => prev ? { ...prev, likes: newLikes } : null);
          }
      }
  }, [currentUser, findImageById, selectedImage, showToast]);

  const handleSetCategory = (id: number | 'all') => {
    setSelectedCategoryId(id);
    setCurrentPage('home'); // Always return to home when a category is selected
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'settings':
        return currentUser ? <SettingsPage showToast={showToast} categories={categories} onUpdateCategories={fetchInitialData} /> : null;
      case 'user-management':
        return currentUser?.role === 'admin' ? <UserManagementPage users={users} images={images} showToast={showToast} /> : null;
      case 'liked-images':
        return currentUser ? <LikedImagesPage images={images} currentUser={currentUser} onImageClick={handleSelectImage} /> : null;
      case 'leaderboard':
        return <LeaderboardPage users={users} images={images} currentUser={currentUser} />;
      case 'profile':
        return currentUser ? <ProfilePage images={images} setCurrentPage={setCurrentPage}/> : null;
      case 'support':
        return <SupportPage />;
      case 'categories':
        return <CategoriesPage categories={categories} images={images} onImageClick={handleSelectImage} currentUser={currentUser} />;
      case 'home':
      default:
        return (
          (isLoading && images.length === 0) ? <ImageGridSkeleton /> :
          <div className="p-4 sm:p-6 lg:p-8">
            <ImageGrid 
              images={filteredImages} 
              onImageClick={handleSelectImage}
              currentUser={currentUser}
            />
          </div>
        );
    }
  }

  const isAnyModalOpen = selectedImage || imageToEdit || isAddModalOpen || isLoginModalOpen || isSignupModalOpen || (imageToDelete !== null);

  return (
    <div className="flex flex-col min-h-screen font-sans text-cyber-on-surface bg-cyber-black">
      <Header
        onCategorySelect={handleSetCategory}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onAddNew={() => setIsAddModalOpen(true)}
        onLogin={() => setIsLoginModalOpen(true)}
        onSignup={() => setIsSignupModalOpen(true)}
        setCurrentPage={setCurrentPage}
        images={images}
      />
      <main className={`flex-grow w-full ${!isAnyModalOpen ? 'pb-20 md:pb-0' : ''}`}>
        {renderPage()}
      </main>
      
      <Footer />
      
      {selectedImage && (
        <ImageDetailModal 
          image={selectedImage}
          images={images}
          onClose={handleCloseModal}
          onRequestDelete={() => handleRequestDelete(selectedImage)}
          onRequestEdit={(image) => {
            handleCloseModal();
            setImageToEdit(image);
          }}
          onCopyPrompt={handleCopyPrompt}
          onShareLink={handleShareLink}
          onToggleLike={handleToggleLike}
          showToast={showToast}
          currentUser={currentUser}
        />
      )}
      
      {imageToEdit && (
        <EditImageModal
          image={imageToEdit}
          categories={categories}
          onClose={() => setImageToEdit(null)}
          onUpdateImage={handleUpdateImage}
        />
      )}
      
      {isAddModalOpen && (
        <AddImageModal 
          onClose={() => setIsAddModalOpen(false)}
          onAddImage={handleAddImage}
          showToast={showToast}
          categories={categories}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)} 
          onSwitchToSignup={() => {
            setIsLoginModalOpen(false);
            setIsSignupModalOpen(true);
          }}
        />
      )}

      {isSignupModalOpen && (
        <SignupModal 
          onClose={() => setIsSignupModalOpen(false)}
          onSwitchToLogin={() => {
            setIsSignupModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={imageToDelete !== null}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa ảnh và câu lệnh này không? Hành động này không thể hoàn tác."
      />

      {toastMessage && <Toast message={toastMessage} />}

      <BottomNavBar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onAddNew={() => setIsAddModalOpen(true)}
        onLogin={() => setIsLoginModalOpen(true)}
      />
    </div>
  );
};

export default App;