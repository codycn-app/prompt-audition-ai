/**
 * Shared Core Engine for Preview 1..10
 * Connects to the real Supabase + Cloudflare R2 backend of Prompt Audition AI
 * without modifying any file in the root app.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://awovbdypluazfcfvnmym.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3ZiZHlwbHVhemZjZnZubXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzYyOTEsImV4cCI6MjEwNzU1MjI5MX0.jFWiLLQGxrctqdWtts8979ibgwSKaj6GsJXxqcV49WU';
const R2_PUBLIC_DOMAIN = 'https://pub-7a59a184512144158a3ce246c7165fee.r2.dev';
const R2_BUCKET_NAME = 'audition-ai-images';
const ITEMS_PER_PAGE = 28;

export const INITIAL_RANKS = [
  { name: 'Thành viên mới', color: '#9CA3AF', requiredExp: 0 },
  { name: 'Khám phá AI', color: '#60A5FA', requiredExp: 100 },
  { name: 'Nghệ sĩ Prompt', color: '#34D399', requiredExp: 500 },
  { name: 'Bậc thầy Sáng tạo', color: '#C084FC', requiredExp: 1500 },
  { name: 'Huyền thoại Audition', color: '#FBBF24', requiredExp: 3000 },
  { name: 'Quản trị viên', color: '#FF4141', requiredExp: -1 },
];

// Pre-emptive session shield
(function cleanCorruptSessions() {
  try {
    const bad = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const v = localStorage.getItem(k);
        if (!v) { bad.push(k); continue; }
        try {
          const s = JSON.parse(v);
          if (!s?.access_token || !s?.refresh_token || !s?.user?.id || s?.user?.aud !== 'authenticated') bad.push(k);
        } catch { bad.push(k); }
      }
    }
    bad.forEach(k => localStorage.removeItem(k));
  } catch {}
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getRankInfo(user) {
  if (!user) return { name: 'Thành viên', color: '#9CA3AF' };
  if (user.role === 'admin') return { name: user.customTitle || 'Quản trị viên', color: user.customTitleColor || '#FF4141' };
  const sorted = [...INITIAL_RANKS].filter(r => r.requiredExp >= 0).sort((a, b) => b.requiredExp - a.requiredExp);
  const rank = sorted.find(r => (user.exp || 0) >= r.requiredExp) || INITIAL_RANKS[0];
  return { name: user.customTitle || rank.name, color: user.customTitleColor || rank.color };
}

export function showToast(msg, type = 'success') {
  let wrap = document.querySelector('.pc-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'pc-toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `pc-toast ${type === 'error' ? 'error' : ''}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, 2800);
}

export async function copyText(text, successMsg = 'Đã sao chép câu lệnh!') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast(successMsg, 'success');
      return true;
    }
  } catch {}
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, 'success');
    return true;
  } catch {
    showToast('Không thể sao chép.', 'error');
    return false;
  } finally {
    ta.remove();
  }
}

export function getObjectPosition(img) {
  if (!img?.thumbnail_crop_data || !img?.original_width || !img?.original_height) return '50% 50%';
  const { x, y, width, height } = img.thumbnail_crop_data;
  return `${((x + width / 2) / img.original_width) * 100}% ${((y + height / 2) / img.original_height) * 100}%`;
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function createThumbnailWebP(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('WebP error')), 'image/webp', 0.82));
}

async function uploadToR2(blob, folder, fileName, contentType) {
  const key = `${folder}/${fileName}`;
  const res = await fetch('/.netlify/functions/storage-service', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload', bucket: R2_BUCKET_NAME, key, contentType, cacheControl: 'public, max-age=31536000, immutable' })
  });
  if (!res.ok) throw new Error('Không thể kết nối dịch vụ lưu trữ R2.');
  const { signedUrl } = await res.json();
  const putRes = await fetch(signedUrl, {
    method: 'PUT', body: blob,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' }
  });
  if (!putRes.ok) throw new Error('Upload lên R2 thất bại.');
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}

export class PromptAppEngine {
  constructor(themeAdapter) {
    this.theme = themeAdapter;
    this.state = {
      categories: [],
      imageCategoryMap: new Map(),
      allImagesMeta: [],
      filteredImages: [],
      loadedImages: [],
      page: 1,
      hasMore: false,
      selectedCategory: 'all',
      searchQuery: '',
      sortBy: 'newest', // newest | views
      viewMode: 'grid', // theme-specific (e.g. grid | 3d)
      currentPage: 'home', // home | article | support | profile
      activePost: null,
      currentUser: null,
      isLoading: true,
      isLoadingMore: false,
    };
    this.profileCache = new Map();
  }

  async init() {
    this.theme.mountShell(this);
    this.bindAuth();
    await this.fetchInitialData();
    this.checkInitialRoute();
    window.addEventListener('popstate', () => this.checkInitialRoute());
  }

  bindAuth() {
    supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (!session) {
        this.state.currentUser = null;
        this.theme.renderAuth(this);
        return;
      }
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        this.state.currentUser = data ? { ...data, email: session.user.email } : null;
      } catch {
        this.state.currentUser = null;
      }
      this.theme.renderAuth(this);
    });
  }

  async fetchAllRows(buildQuery) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await buildQuery(from, from + 999);
      if (error) throw error;
      const chunk = data || [];
      rows.push(...chunk);
      if (chunk.length < 1000) break;
    }
    return rows;
  }

  async fetchInitialData() {
    this.state.isLoading = true;
    this.theme.renderLoading(this, true);
    try {
      const { data: cats, error: catErr } = await supabase.from('categories').select('*').order('position', { ascending: true });
      if (catErr) throw catErr;
      this.state.categories = cats || [];
      const validIds = new Set(this.state.categories.map(c => c.id));

      const links = await this.fetchAllRows((from, to) =>
        supabase.from('image_categories').select('image_id, category_id').order('image_id').range(from, to)
      );
      const map = new Map();
      links.forEach(l => {
        if (!validIds.has(l.category_id)) return;
        if (!map.has(l.image_id)) map.set(l.image_id, []);
        map.get(l.image_id).push(l.category_id);
      });
      this.state.imageCategoryMap = map;

      // Lightweight metadata for instant client search & sort
      const imgs = await this.fetchAllRows((from, to) =>
        supabase.from('images').select('id, title, prompt, image_url, thumbnail_url, views, created_at, user_id, thumbnail_crop_data, original_width, original_height')
          .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to)
      );
      const catLookup = new Map(this.state.categories.map(c => [c.id, c]));
      this.state.allImagesMeta = imgs.map(img => ({
        ...img,
        categories: (map.get(img.id) || []).map(cid => catLookup.get(cid)).filter(Boolean),
      }));

      this.applyFilters();
    } catch (err) {
      console.error(err);
      showToast('Không thể tải dữ liệu từ Supabase: ' + err.message, 'error');
    } finally {
      this.state.isLoading = false;
      this.theme.renderLoading(this, false);
    }
  }

  applyFilters() {
    const { allImagesMeta, selectedCategory, searchQuery, sortBy } = this.state;
    const q = searchQuery.trim().toLowerCase();

    let list = allImagesMeta.filter(img => {
      if (selectedCategory === 'uncategorized') {
        if (img.categories.length > 0) return false;
      } else if (selectedCategory !== 'all') {
        if (!img.categories.some(c => c.id === selectedCategory)) return false;
      }
      if (q) {
        const matchTitle = (img.title || '').toLowerCase().includes(q);
        const matchPrompt = (img.prompt || '').toLowerCase().includes(q);
        const matchCat = img.categories.some(c => c.name.toLowerCase().includes(q));
        if (!matchTitle && !matchPrompt && !matchCat) return false;
      }
      return true;
    });

    if (sortBy === 'views') {
      list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    this.state.filteredImages = list;
    this.state.page = 1;
    this.state.loadedImages = list.slice(0, ITEMS_PER_PAGE);
    this.state.hasMore = list.length > ITEMS_PER_PAGE;
    this.theme.renderCategories(this);
    this.theme.renderGallery(this);
  }

  loadMore() {
    if (!this.state.hasMore || this.state.isLoadingMore) return;
    this.state.page += 1;
    const end = this.state.page * ITEMS_PER_PAGE;
    this.state.loadedImages = this.state.filteredImages.slice(0, end);
    this.state.hasMore = end < this.state.filteredImages.length;
    this.theme.renderGallery(this, true);
  }

  setCategory(catId) {
    this.state.selectedCategory = catId;
    this.state.currentPage = 'home';
    this.applyFilters();
    this.theme.renderPage(this);
  }

  setSearch(q) {
    this.state.searchQuery = q;
    this.state.currentPage = 'home';
    this.applyFilters();
    this.theme.renderPage(this);
  }

  setSort(sortBy) {
    this.state.sortBy = sortBy;
    this.applyFilters();
  }

  setPage(page) {
    this.state.currentPage = page;
    if (page === 'home') {
      const url = new URL(window.location.href);
      url.searchParams.delete('post');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    this.theme.renderPage(this);
  }

  async fetchAuthor(userId) {
    if (!userId) return null;
    if (this.profileCache.has(userId)) return this.profileCache.get(userId);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) this.profileCache.set(userId, data);
    return data || null;
  }

  async recordView(image) {
    image.views = (image.views || 0) + 1;
    supabase.rpc('increment_image_views', { p_image_id: image.id }).then(() => {});
  }

  // Mechanism 1: Thumbnail -> Detail Modal
  async openModal(image, sourceEl = null) {
    this.state.activePost = image;
    const url = new URL(window.location.href);
    url.searchParams.set('post', image.id);
    window.history.pushState({ postId: image.id, mode: 'modal' }, '', url.pathname + url.search);

    const author = await this.fetchAuthor(image.user_id);
    image.profiles = author;
    this.recordView(image);
    this.theme.openDetailModal(this, image, sourceEl);
  }

  // Mechanism 2: Dedicated Shareable Article View
  async openArticle(imageOrId) {
    let image = typeof imageOrId === 'object' ? imageOrId : this.state.allImagesMeta.find(i => i.id === Number(imageOrId));
    if (!image && imageOrId) {
      const { data } = await supabase.from('images').select('*').eq('id', Number(imageOrId)).single();
      if (data) image = { ...data, categories: [] };
    }
    if (!image) {
      showToast('Không tìm thấy bài viết.', 'error');
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('post', image.id);
    url.searchParams.set('view', 'article');
    window.history.pushState({ postId: image.id, mode: 'article' }, '', url.pathname + url.search);

    image.profiles = await this.fetchAuthor(image.user_id);
    this.recordView(image);
    this.state.activePost = image;
    this.state.currentPage = 'article';
    this.theme.closeDetailModal(this);
    this.theme.renderPage(this);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeModal() {
    this.state.activePost = null;
    const url = new URL(window.location.href);
    url.searchParams.delete('post');
    url.searchParams.delete('view');
    window.history.replaceState({}, '', url.pathname + url.search);
    this.theme.closeDetailModal(this);
  }

  getShareUrl(image, asArticle = true) {
    const url = new URL(window.location.href);
    url.searchParams.set('post', image.id);
    if (asArticle) url.searchParams.set('view', 'article');
    return url.toString();
  }

  checkInitialRoute() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    const view = params.get('view');
    if (postId && /^\d+$/.test(postId)) {
      if (view === 'article') {
        this.openArticle(Number(postId));
      } else {
        const found = this.state.allImagesMeta.find(i => i.id === Number(postId));
        if (found) this.openModal(found);
        else this.openArticle(Number(postId));
      }
    }
  }

  async login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showToast('Đăng nhập thành công!');
  }

  async signup(email, password, username) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) throw error;
    showToast('Đăng ký thành công! Vui lòng kiểm tra email nếu cần xác nhận.');
  }

  async logout() {
    await supabase.auth.signOut();
    showToast('Đã đăng xuất.');
    this.setPage('home');
  }

  async createPost({ title, prompt, categoryIds, file }) {
    if (!this.state.currentUser) throw new Error('Vui lòng đăng nhập để đăng ảnh.');
    const ext = file.name.split('.').pop() || 'png';
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const imageUrl = await uploadToR2(file, 'images', `${stamp}.${ext}`, file.type);
    const thumbBlob = await createThumbnailWebP(file);
    const thumbnailUrl = await uploadToR2(thumbBlob, 'images', `${stamp}.webp`, 'image/webp');

    const { data: inserted, error } = await supabase.from('images').insert({
      title, prompt, image_url: imageUrl, thumbnail_url: thumbnailUrl, user_id: this.state.currentUser.id
    }).select().single();
    if (error) throw error;

    if (categoryIds.length > 0) {
      await supabase.from('image_categories').insert(categoryIds.map(cid => ({ image_id: inserted.id, category_id: cid })));
    }
    await supabase.rpc('add_exp', { user_id_to_update: this.state.currentUser.id, exp_to_add: 50 });
    showToast('Đăng ảnh thành công! (+50 EXP)');
    await this.fetchInitialData();
  }

  async deletePost(image) {
    const { error } = await supabase.from('images').delete().eq('id', image.id);
    if (error) throw error;
    showToast('Đã xóa bài đăng!');
    this.closeModal();
    if (this.state.currentPage === 'article') this.setPage('home');
    await this.fetchInitialData();
  }
}
