import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ImagePrompt, Comment, User, Category, Page } from './types';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import ImageGrid from './components/ImageGrid';
import ImageDetailModal from './components/ImageDetailModal';
import AddImageModal from './components/AddImageModal';
import EditImageModal from './components/EditImageModal';
import ConfirmationModal from './components/ConfirmationModal';
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
import { getSupabaseClient } from './supabaseClient';
import { useToast } from './contexts/ToastContext';


const App: React.FC = () => {
  const [images, setImages] = useState<ImagePrompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, users, addExp, isAuthLoading } = useAuth();
  const { showToast } = useToast();
  
  const [selectedImage, setSelectedImage] = useState<ImagePrompt | null>(null);
  const [imageToEdit, setImageToEdit] = useState<ImagePrompt | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  
  const [imageToDelete, setImageToDelete] = useState<ImagePrompt | null>(null);
  
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Definitive fix for theme initialization.
  // This runs only once and ensures a default theme is set if none exists.
  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  // Time-based EXP gain
  useEffect(() => {
    if (currentUser && addExp) {
      const intervalId = setInterval(() => {
        addExp(1); // 1 EXP per minute
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [currentUser, addExp]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    try {
      // Step 1: Fetch all categories and create a lookup map.
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('position', { ascending: true });
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
      const categoryMap = new Map((categoriesData || []).map(cat => [cat.id, cat]));

      // Step 2: Fetch the join table data to link images and categories.
      const { data: imageCategoriesData, error: imageCategoriesError } = await supabase
        .from('image_categories')
        .select('image_id, category_id');
      if (imageCategoriesError) throw imageCategoriesError;
      
      const imageToCategoriesMap = new Map<number, number[]>();
      (imageCategoriesData || []).forEach(link => {
        if (!imageToCategoriesMap.has(link.image_id)) {
          imageToCategoriesMap.set(link.image_id, []);
        }
        imageToCategoriesMap.get(link.image_id)!.push(link.category_id);
      });

      // Step 3: Fetch images WITHOUT profiles to avoid RLS issues on anonymous load.
      // Profile data will be lazy-loaded when an image is clicked.
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*') // Simple, safe query.
        .order('created_at', { ascending: false });
      
      if (imagesError) throw imagesError;

      // Step 4: Combine image and category data on the client.
      const allImages: ImagePrompt[] = (imagesData || []).map(img => {
        const categoryIds = imageToCategoriesMap.get(img.id) || [];
        const imgCategories = categoryIds.map(id => categoryMap.get(id)).filter(Boolean) as Category[];
        
        return {
          ...(img as any),
          profiles: null, // Set to null initially; fetched on demand.
          categories: imgCategories,
          comments_count: img.comments_count || 0, // Ensure it's a number
        };
      });

      setImages(allImages);

    } catch (error: any) {
      console.error('CRITICAL: Failed to fetch initial data:', error);
      showToast(`Lỗi nghiêm trọng: Không thể tải dữ liệu. (${error.message})`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Architectural Fix: Wait for the authentication to be resolved before fetching initial data.
    // This prevents a race condition where data is fetched with an unauthenticated client.
    if (isAuthLoading) {
      return;
    }
    fetchInitialData();
  }, [fetchInitialData, isAuthLoading]);


  const findImageById = useCallback((id: number) => {
    return images.find(img => img.id === id);
  }, [images]);

  const handleCopyPrompt = useCallback(async (prompt: string) => {
    // Modern async clipboard API with fallback
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(prompt);
            showToast('Đã sao chép câu lệnh!', 'success');
            return;
        } catch (err) {
            console.error('Lỗi sao chép (API):', err);
            // Fallback will be attempted below
        }
    }

    // Fallback for older browsers / non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = prompt;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Đã sao chép câu lệnh!', 'success');
    } catch (err) {
        console.error('Lỗi sao chép (fallback):', err);
        showToast('Sao chép thất bại. Trình duyệt không hỗ trợ.', 'error');
    } finally {
        document.body.removeChild(textArea);
    }
  }, [showToast]);

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleSelectImage = useCallback(async (image: ImagePrompt) => {
    const supabase = getSupabaseClient();
    // Optimistically open the modal with the data we already have.
    setSelectedImage(image);
    
    // Asynchronously fetch the full details (author profile). Comment count is now pre-fetched.
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', image.user_id)
        .single();

    if (profileError) {
        console.error('Error fetching image details:', profileError);
    } else {
        // Update the selected image in state with the newly fetched profile.
        setSelectedImage(prev => prev ? { 
            ...prev, 
            profiles: profileData,
        } : null);
    }

    // Update view count in DB and local state.
    const newViews = (image.views || 0) + 1;
    const { error: viewError } = await supabase
      .from('images')
      .update({ views: newViews })
      .eq('id', image.id);
    
    if (!viewError) {
        setImages(prevImages => 
            prevImages.map(img => 
                img.id === image.id ? { ...img, views: newViews } : img
            )
        );
        setSelectedImage(prev => prev ? { ...prev, views: newViews } : null);
    }
  }, []);

  const filteredImages = useMemo(() => {
    if (selectedCategoryId === 'all') return images;
    // Corrected logic for many-to-many relationship
    return images.filter(image => image.categories && image.categories.some(cat => cat.id === selectedCategoryId));
  }, [images, selectedCategoryId]);
  
  const handleAddImage = useCallback(async () => {
    setIsAddModalOpen(false);
    showToast('Đã thêm ảnh mới thành công! (+50 EXP)', 'success');
    if (addExp) await addExp(50); // Add EXP for new image
    await fetchInitialData();
  }, [fetchInitialData, showToast, addExp]);
  
  const handleUpdateImage = useCallback(async () => {
    setImageToEdit(null);
    showToast('Đã cập nhật ảnh thành công!', 'success');
    await fetchInitialData();
  }, [fetchInitialData, showToast]);

  const handleRequestDelete = useCallback((image: ImagePrompt) => {
    if (!currentUser || (image.user_id !== currentUser.id && currentUser.role !== 'admin')) {
        showToast('Bạn không có quyền xóa ảnh này.', 'error');
        return;
    }
    setImageToDelete(image);
  }, [currentUser, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!imageToDelete) return;
    const supabase = getSupabaseClient();

    const bucketName = 'images';

    if (imageToDelete.image_url) {
        const imagePath = imageToDelete.image_url.split(`/${bucketName}/`)[1];
        if (imagePath) {
            await supabase.storage.from(bucketName).remove([imagePath]);
        }
    }
    
    const { error } = await supabase.from('images').delete().eq('id', imageToDelete.id);

    if (error) {
        showToast('Lỗi: không thể xóa ảnh.', 'error');
        console.error(error);
    } else {
        showToast('Đã xóa ảnh thành công!', 'success');
        if (selectedImage && selectedImage.id === imageToDelete.id) {
            handleCloseModal();
        }
        setImages(prev => prev.filter(image => image.id !== imageToDelete.id));
    }
    setImageToDelete(null);
  }, [imageToDelete, selectedImage, showToast]);
  
  const handleToggleLike = useCallback(async (imageId: number) => {
      if (!currentUser) {
          showToast('Bạn phải đăng nhập để thích ảnh!', 'info');
          return;
      }

      const image = findImageById(imageId);
      if (!image) return;
      const supabase = getSupabaseClient();

      const hasLiked = image.likes.includes(currentUser.id);
      const newLikes = hasLiked
          ? image.likes.filter(id => id !== currentUser.id)
          : [...image.likes, currentUser.id];

      const { error } = await supabase
        .from('images')
        .update({ likes: newLikes })
        .eq('id', imageId);

      if (error) {
          showToast('Đã có lỗi xảy ra.', 'error');
          console.error(error);
      } else {
          setImages(prevImages => 
            prevImages.map(img => img.id === imageId ? { ...img, likes: newLikes } : img)
          );
          if (selectedImage && selectedImage.id === imageId) {
            setSelectedImage(prev => prev ? { ...prev, likes: newLikes } : null);
          }
          if (!hasLiked && addExp) {
             showToast('Đã thích ảnh! (+5 EXP)', 'success');
             addExp(5); // Add EXP for liking
          }
      }
  }, [currentUser, findImageById, selectedImage, showToast, addExp]);
  
  const handleCommentAdded = useCallback((imageId: number) => {
    // This function ensures the comment count is updated immediately across the app
    // for a smoother user experience.
    const updateCount = (prev: ImagePrompt | null) => {
        if (!prev) return null;
        const currentCount = selectedImage?.id === imageId ? (selectedImage.comments_count || 0) : (prev.comments_count || 0);
        return { ...prev, comments_count: currentCount + 1 };
    };

    setImages(prevImages =>
        prevImages.map(img =>
            img.id === imageId ? updateCount(img) as ImagePrompt : img
        )
    );
    if (selectedImage && selectedImage.id === imageId) {
        setSelectedImage(updateCount);
    }
  }, [selectedImage]);

  const handleSetCategory = (id: number | 'all') => {
    setSelectedCategoryId(id);
    setCurrentPage('home'); // Always return to home when a category is selected
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'settings':
        return currentUser ? <SettingsPage categories={categories} onUpdateCategories={fetchInitialData} /> : null;
      case 'user-management':
        // Fix: Removed redundant 'users' prop. The component gets this data from context.
        return currentUser?.role === 'admin' ? <UserManagementPage images={images} /> : null;
      case 'liked-images':
        return currentUser ? <LikedImagesPage images={images} currentUser={currentUser} onImageClick={handleSelectImage} /> : null;
      case 'leaderboard':
        // Fix: Removed redundant 'users' prop. The component gets this data from context.
        return <LeaderboardPage images={images} currentUser={currentUser} />;
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
      <main className="flex-grow w-full">
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
          onToggleLike={handleToggleLike}
          currentUser={currentUser}
          onCommentAdded={handleCommentAdded}
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