
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImagePrompt, Category, CategoryFilter } from './types';
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
import ImageGridSkeleton from './components/ImageGridSkeleton';
import BottomNavBar from './components/BottomNavBar';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import CategoriesPage from './pages/CategoriesPage';
import MigrationPage from './pages/MigrationPage';
import { getSupabaseClient } from './supabaseClient';
import { useToast } from './contexts/ToastContext';
import { deleteFile } from './lib/storage';

// Constants for pagination
const ITEMS_PER_PAGE = 24;
const SUPABASE_PAGE_SIZE = 1000;
const BROKEN_IMAGE_CHECK_CONCURRENCY = 6;

type LightweightImage = {
  id: number;
  created_at: string;
  image_url: string;
};

const fetchAllRows = async <T,>(
  createQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> => {
  const rows: T[] = [];

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await createQuery(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) throw error;

    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < SUPABASE_PAGE_SIZE) break;
  }

  return rows;
};

const App: React.FC = () => {
  // Main data state
  const [images, setImages] = useState<ImagePrompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Pagination & Data Management State
  const [allImageIds, setAllImageIds] = useState<LightweightImage[]>([]); // Lightweight list
  const [filteredIds, setFilteredIds] = useState<number[]>([]); // IDs after category filter
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [imageCategoryMap, setImageCategoryMap] = useState<Map<number, number[]>>(new Map());
  const [brokenImageIds, setBrokenImageIds] = useState<Set<number>>(new Set());
  const [isCheckingBrokenImages, setIsCheckingBrokenImages] = useState(false);
  const [brokenScanCompleted, setBrokenScanCompleted] = useState(false);
  const [brokenScanProgress, setBrokenScanProgress] = useState({ checked: 0, total: 0 });
  const brokenScanVersion = useRef(0);
  const brokenScanRunning = useRef(false);

  const { currentUser, addExp, isAuthLoading } = useAuth();
  const { showToast } = useToast();
  
  const [selectedImage, setSelectedImage] = useState<ImagePrompt | null>(null);
  const [imageToEdit, setImageToEdit] = useState<ImagePrompt | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryFilter>('all');
  
  const [imageToDelete, setImageToDelete] = useState<ImagePrompt | null>(null);
  
  const [currentPage, setCurrentPage] = useState<string>('home');

  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  useEffect(() => {
    if (currentUser && addExp) {
      const intervalId = setInterval(() => {
        addExp(1);
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [currentUser, addExp]);

  // 1. Initial Data Fetch (Lightweight)
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    try {
      // A. Fetch Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('position', { ascending: true });
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
      const validCategoryIds = new Set((categoriesData || []).map(category => category.id));

      // B. Fetch Image-Category Links (Lightweight)
      const imageCategoriesData = await fetchAllRows<{ image_id: number; category_id: number }>(
        (from, to) => supabase
          .from('image_categories')
          .select('image_id, category_id')
          .order('image_id', { ascending: true })
          .order('category_id', { ascending: true })
          .range(from, to)
      );
      
      const map = new Map<number, number[]>();
      imageCategoriesData.forEach(link => {
        // Ignore stale relationships that point to a category which has been deleted.
        // Those images must be treated as uncategorized so an admin can repair them.
        if (!validCategoryIds.has(link.category_id)) return;
        if (!map.has(link.image_id)) {
            map.set(link.image_id, []);
        }
        map.get(link.image_id)!.push(link.category_id);
      });
      setImageCategoryMap(map);

      // C. Fetch lightweight image data. The URL is needed by the admin broken-image checker.
      const imageIds = await fetchAllRows<LightweightImage>(
        (from, to) => supabase
          .from('images')
          .select('id, created_at, image_url')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
      );

      setAllImageIds(imageIds);

    } catch (error: any) {
      console.error('CRITICAL: Failed to fetch initial data:', error);
      showToast(`Lỗi nghiêm trọng: Không thể tải dữ liệu. (${error.message})`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    fetchInitialData();
  }, [fetchInitialData, isAuthLoading]);

  const checkImageUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!url || !/^https?:\/\//i.test(url)) return false;

    const probeImage = () => new Promise<boolean>((resolve) => {
      const probe = new Image();
      const timeout = window.setTimeout(() => {
        probe.onload = null;
        probe.onerror = null;
        probe.src = '';
        resolve(false);
      }, 12000);

      probe.onload = () => {
        window.clearTimeout(timeout);
        resolve(probe.naturalWidth > 0 && probe.naturalHeight > 0);
      };
      probe.onerror = () => {
        window.clearTimeout(timeout);
        resolve(false);
      };
      probe.src = url;
    });

    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (response.status === 405 || response.status === 501) return probeImage();
      return response.ok;
    } catch {
      // Some storage providers display images normally but reject cross-origin HEAD.
      return probeImage();
    }
  }, []);

  const scanBrokenImages = useCallback(async () => {
    if (currentUser?.role !== 'admin' || brokenScanRunning.current) return;

    brokenScanRunning.current = true;
    const scanVersion = ++brokenScanVersion.current;
    const items = allImageIds;
    const brokenIds: number[] = [];
    let nextIndex = 0;
    let checked = 0;

    setIsCheckingBrokenImages(true);
    setBrokenScanProgress({ checked: 0, total: items.length });

    const worker = async () => {
      while (nextIndex < items.length && brokenScanVersion.current === scanVersion) {
        const item = items[nextIndex++];
        const isAvailable = await checkImageUrl(item.image_url);
        if (!isAvailable) brokenIds.push(item.id);
        checked += 1;

        if (checked % 10 === 0 || checked === items.length) {
          setBrokenScanProgress({ checked, total: items.length });
        }
      }
    };

    try {
      const workerCount = Math.min(BROKEN_IMAGE_CHECK_CONCURRENCY, Math.max(1, items.length));
      await Promise.all(Array.from({ length: workerCount }, worker));

      if (brokenScanVersion.current === scanVersion) {
        setBrokenImageIds(new Set(brokenIds));
        setBrokenScanCompleted(true);
        showToast(`Đã tìm thấy ${brokenIds.length} ảnh bị lỗi hiển thị.`, brokenIds.length ? 'error' : 'success');
      }
    } finally {
      if (brokenScanVersion.current === scanVersion) {
        brokenScanRunning.current = false;
        setIsCheckingBrokenImages(false);
      }
    }
  }, [allImageIds, checkImageUrl, currentUser?.role, showToast]);

  useEffect(() => {
    if (
      selectedCategoryId === 'broken' &&
      currentUser?.role === 'admin' &&
      !isLoading &&
      !brokenScanCompleted &&
      !isCheckingBrokenImages
    ) {
      scanBrokenImages();
    }
  }, [selectedCategoryId, currentUser?.role, isLoading, brokenScanCompleted, isCheckingBrokenImages, scanBrokenImages]);

  // 2. Filtering Logic (Client-side on IDs)
  useEffect(() => {
    let ids = allImageIds.map(item => item.id);
    
    if (selectedCategoryId === 'broken') {
        ids = currentUser?.role === 'admin'
          ? ids.filter(id => brokenImageIds.has(id))
          : [];
    } else if (selectedCategoryId === 'uncategorized') {
        ids = currentUser?.role === 'admin'
          ? ids.filter(id => (imageCategoryMap.get(id)?.length || 0) === 0)
          : [];
    } else if (selectedCategoryId !== 'all') {
        ids = ids.filter(id => {
            const catIds = imageCategoryMap.get(id);
            return catIds && catIds.includes(selectedCategoryId);
        });
    }

    setFilteredIds(ids);
    setPage(1); // Reset page on filter change
    setImages([]); // Clear current images
    setHasMore(ids.length > 0);
  }, [selectedCategoryId, allImageIds, imageCategoryMap, brokenImageIds, currentUser?.role]);

  // 3. Fetch Full Image Data (Chunked)
  const loadImages = useCallback(async (pageToLoad: number, currentFilteredIds: number[], checkActive?: () => boolean) => {
      if (currentFilteredIds.length === 0) return;

      const startIndex = (pageToLoad - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const idsBatch = currentFilteredIds.slice(startIndex, endIndex);

      if (idsBatch.length === 0) {
          setHasMore(false);
          return;
      }

      setIsLoadingMore(true);
      const supabase = getSupabaseClient();
      
      try {
          // Fetch full data ONLY for the current batch
          const { data: imagesData, error } = await supabase
              .from('images')
              .select('*')
              .in('id', idsBatch)
              .order('created_at', { ascending: false }); // Maintain order

          if (error) throw error;
          
          if (checkActive && !checkActive()) return;

          const categoryLookup = new Map(categories.map(c => [c.id, c]));

          const processedImages: ImagePrompt[] = (imagesData || []).map(img => {
            const categoryIds = imageCategoryMap.get(img.id) || [];
            const imgCategories = categoryIds.map(id => categoryLookup.get(id)).filter(Boolean) as Category[];
            return {
                ...(img as any),
                profiles: null,
                categories: imgCategories,
            };
          });

          // If page 1, replace. If page > 1, append.
          setImages(prev => pageToLoad === 1 ? processedImages : [...prev, ...processedImages]);
          setHasMore(endIndex < currentFilteredIds.length);

      } catch (err) {
          if (checkActive && !checkActive()) return;
          console.error("Error loading image chunk:", err);
          showToast("Không thể tải thêm ảnh.", "error");
      } finally {
          if (!checkActive || checkActive()) {
              setIsLoadingMore(false);
              // Initial loading state for the whole app is done in fetchInitialData, 
              // but we ensure it's off here just in case.
              if (pageToLoad === 1) setIsLoading(false);
          }
      }
  }, [categories, imageCategoryMap, showToast]);

  // Trigger load when filtered IDs or Page changes
  useEffect(() => {
      let isActive = true;
      
      const doLoad = async () => {
          // Only load if we have filtered IDs (initial fetch done)
          if (filteredIds.length > 0 || (allImageIds.length > 0 && filteredIds.length === 0 && selectedCategoryId !== 'all')) {
              await loadImages(page, filteredIds, () => isActive);
          } else if (allImageIds.length > 0 && filteredIds.length === 0 && selectedCategoryId === 'all') {
              // Case where there are simply no images in DB
               if (isActive) {
                   setImages([]);
                   setHasMore(false);
               }
          }
      };
      
      doLoad();
      
      return () => {
          isActive = false;
      };
  }, [page, filteredIds, loadImages, allImageIds.length, selectedCategoryId]);

  const handleLoadMore = () => {
      setPage(prev => prev + 1);
  };

  // --- Handlers ---

  const handleCopyPrompt = useCallback(async (prompt: string) => {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(prompt);
            showToast('Đã sao chép câu lệnh!', 'success');
            return;
        } catch (err) { console.error(err); }
    }
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
        showToast('Sao chép thất bại.', 'error');
    } finally {
        document.body.removeChild(textArea);
    }
  }, [showToast]);

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleSelectImage = useCallback(async (image: ImagePrompt) => {
    const supabase = getSupabaseClient();
    setSelectedImage(image);
    
    const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', image.user_id)
        .single();

    if (profileData) {
        setSelectedImage(prev => prev ? { ...prev, profiles: profileData } : null);
    }

    const newViews = (image.views || 0) + 1;
    await supabase.from('images').update({ views: newViews }).eq('id', image.id);
    
    setImages(prev => prev.map(img => img.id === image.id ? { ...img, views: newViews } : img));
    setSelectedImage(prev => prev ? { ...prev, views: newViews } : null);
  }, []);

  const handleAddImage = useCallback(async () => {
    setIsAddModalOpen(false);
    showToast('Đã thêm ảnh mới thành công! (+50 EXP)', 'success');
    if (addExp) await addExp(50);
    // Refresh lightweight data to get new ID at top
    fetchInitialData();
  }, [fetchInitialData, showToast, addExp]);
  
  const handleUpdateImage = useCallback(async (replacedImage: boolean) => {
    const updatedImageId = imageToEdit?.id;
    setImageToEdit(null);
    if (replacedImage && updatedImageId) {
      setBrokenImageIds(prev => {
        const next = new Set(prev);
        next.delete(updatedImageId);
        return next;
      });
    }
    showToast('Đã cập nhật ảnh thành công!', 'success');
    // Refresh the relationship map before rendering the edited image.
    await fetchInitialData();
  }, [fetchInitialData, imageToEdit?.id, showToast]);

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

    if (imageToDelete.image_url) {
        await deleteFile(imageToDelete.image_url);
    }
    
    const { error } = await supabase.from('images').delete().eq('id', imageToDelete.id);

    if (error) {
        showToast('Lỗi: không thể xóa ảnh.', 'error');
    } else {
        showToast('Đã xóa ảnh thành công!', 'success');
        if (selectedImage && selectedImage.id === imageToDelete.id) {
            handleCloseModal();
        }
        // Update local state by removing ID and Image
        setAllImageIds(prev => prev.filter(i => i.id !== imageToDelete.id));
        setImages(prev => prev.filter(image => image.id !== imageToDelete.id));
        setBrokenImageIds(prev => {
          const next = new Set(prev);
          next.delete(imageToDelete.id);
          return next;
        });
    }
    setImageToDelete(null);
  }, [imageToDelete, selectedImage, showToast]);
  
  const handleSetCategory = (id: CategoryFilter) => {
    setSelectedCategoryId(id);
    setCurrentPage('home');
  }

  const handleRescanBrokenImages = () => {
    if (isCheckingBrokenImages) return;
    setBrokenImageIds(new Set());
    setBrokenScanCompleted(false);
  };

  useEffect(() => {
    if (window.location.pathname === '/migration') {
        setCurrentPage('migration');
    }
  }, []);

  const renderPage = () => {
    switch(currentPage) {
      case 'migration':
        return <MigrationPage />;
      case 'settings':
        return currentUser ? <SettingsPage categories={categories} onUpdateCategories={fetchInitialData} setCurrentPage={setCurrentPage as any} /> : null;
      case 'user-management':
        return currentUser?.role === 'admin' ? <UserManagementPage images={images} /> : null;
      case 'profile':
        return currentUser ? <ProfilePage images={images} setCurrentPage={setCurrentPage as any}/> : null;
      case 'support':
        return <SupportPage />;
      case 'categories':
        return <CategoriesPage categories={categories} images={images} onImageClick={handleSelectImage} />;
      case 'home':
      default:
        return (
          <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            {isLoading && page === 1 ? (
              <ImageGridSkeleton />
            ) : (
              <>
                {selectedCategoryId === 'broken' && currentUser?.role === 'admin' && (
                  <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-red-200">
                        {isCheckingBrokenImages
                          ? `Đang kiểm tra ảnh ${brokenScanProgress.checked}/${brokenScanProgress.total}`
                          : `Có ${brokenImageIds.size} ảnh bị lỗi hiển thị`}
                      </div>
                      <div className="mt-1 text-sm text-cyber-on-surface-secondary">
                        Thay ảnh mới thành công sẽ tự động gỡ ảnh đó khỏi danh sách này.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRescanBrokenImages}
                      disabled={isCheckingBrokenImages}
                      className="shrink-0 rounded-lg border border-red-400/50 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCheckingBrokenImages ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
                    </button>
                  </div>
                )}

                {selectedCategoryId === 'broken' && isCheckingBrokenImages ? (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500/30 border-t-red-400" />
                    <div className="w-full max-w-md">
                      <div className="mb-2 text-sm text-cyber-on-surface-secondary">
                        Đã kiểm tra {brokenScanProgress.checked} / {brokenScanProgress.total} ảnh
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-500 to-cyber-pink transition-all"
                          style={{ width: `${brokenScanProgress.total ? (brokenScanProgress.checked / brokenScanProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <ImageGrid
                    images={images}
                    onImageClick={handleSelectImage}
                  />
                )}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-8 flex justify-center pb-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-8 py-3 font-semibold text-white transition-all duration-300 rounded-full shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang tải...</span>
                        </>
                      ) : (
                        <span>Xem thêm ({filteredIds.length - images.length})</span>
                      )}
                    </button>
                  </div>
                )}
                
                {!hasMore && images.length > 0 && (
                   <div className="mt-8 text-center text-cyber-on-surface-secondary pb-8 text-sm italic">
                      Đã hiển thị hết tất cả ảnh.
                   </div>
                )}
              </>
            )}
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
        setCurrentPage={setCurrentPage as any}
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
        currentPage={currentPage as any}
        setCurrentPage={setCurrentPage as any}
        onAddNew={() => setIsAddModalOpen(true)}
        onLogin={() => setIsLoginModalOpen(true)}
      />
    </div>
  );
};

export default App;
