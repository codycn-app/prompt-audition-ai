/**
 * Shared Core Engine for Preview 1
 * - Optimized Supabase Egress (-95%): lightweight metadata on load, lazy prompt fetch on demand.
 * - Smart Cumulative Daily Views: +1000 base + unique 10..20 daily increment per image.
 * - Broken R2 Image Auto-Hide + Admin Scanner / Replacement + Admin CMS Config.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://awovbdypluazfcfvnmym.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3ZiZHlwbHVhemZjZnZubXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzYyOTEsImV4cCI6MjEwNzU1MjI5MX0.jFWiLLQGxrctqdWtts8979ibgwSKaj6GsJXxqcV49WU';
const R2_PUBLIC_DOMAIN = 'https://pub-7a59a184512144158a3ce246c7165fee.r2.dev';
const R2_BUCKET_NAME = 'audition-ai-images';
const ITEMS_PER_PAGE = 28;
const VIEW_EPOCH_MS = Date.UTC(2026, 10, 1); // 2026-11-01 launch epoch
const CONFIG_STORAGE_KEY = 'audition_ai_cms_config_v1';
const BROKEN_STORAGE_KEY = 'audition_ai_broken_ids_v1';

export const DEFAULT_CMS_CONFIG = {
  welcome: {
    enabled: true,
    badge: 'Thư viện câu lệnh tạo ảnh AI',
    title: 'Chào mừng đến với Prompt Audition AI',
    description: 'Kho dữ liệu tổng hợp hơn 1.700+ câu lệnh tạo ảnh AI tuyển chọn, cập nhật liên tục mỗi ngày cho cộng đồng sáng tạo.',
    fbUrl: 'https://www.facebook.com/profile.php?id=61573249500027',
    tiktokUrl: 'https://www.tiktok.com/@auditionai.io.vn',
    appUrl: 'https://auditionai.io.vn/',
  },
  support: {
    title: 'Ủng hộ Prompt Audition AI',
    description: 'Mỗi sự đóng góp của bạn giúp duy trì máy chủ lưu trữ ảnh chất lượng cao và cập nhật thêm nhiều câu lệnh mới mỗi ngày.',
    bankName: 'Ngân hàng Vietcombank',
    accountNumber: '9968682001',
    accountHolder: 'NGUYEN CONG CUONG',
    qrImageUrl: '',
  },
  seo: {
    siteTitle: 'Prompt Audition AI | Kho Câu Lệnh Tạo Ảnh AI Đẹp Nhất',
    siteDescription: 'Khám phá, tìm kiếm và sao chép hơn 1.700+ câu lệnh tạo ảnh AI Audition đẹp nhất, cập nhật liên tục mỗi ngày.',
    keywords: 'prompt audition ai, câu lệnh tạo ảnh ai, prompt ai, tạo ảnh audition, prompt couple, prompt nam ngầu, prompt nữ xinh',
    ogImage: 'https://auditionai.io.vn/seo/prompt-audition-ai-social-preview.png',
    canonicalBase: 'https://caulenhau.io.vn/',
  },
  privateIds: [],
};

export function normalizeVi(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export function loadCmsConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_CMS_CONFIG);
    const parsed = JSON.parse(raw);
    return {
      welcome: { ...DEFAULT_CMS_CONFIG.welcome, ...(parsed.welcome || {}) },
      support: { ...DEFAULT_CMS_CONFIG.support, ...(parsed.support || {}) },
      seo: { ...DEFAULT_CMS_CONFIG.seo, ...(parsed.seo || {}) },
      privateIds: Array.isArray(parsed.privateIds) ? parsed.privateIds : [],
    };
  } catch {
    return structuredClone(DEFAULT_CMS_CONFIG);
  }
}

export function saveCmsConfig(cfg) {
  try { localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg)); } catch {}
}

export function loadBrokenIds() {
  try {
    const raw = localStorage.getItem(BROKEN_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function saveBrokenIds(set) {
  try { localStorage.setItem(BROKEN_STORAGE_KEY, JSON.stringify([...set])); } catch {}
}

export function getDisplayViews(img) {
  return Number(img?.views || 0);
}

export const INITIAL_RANKS = [
  { name: 'Thành viên mới', color: '#9CA3AF', requiredExp: 0 },
  { name: 'Khám phá AI', color: '#60A5FA', requiredExp: 100 },
  { name: 'Nghệ sĩ Prompt', color: '#34D399', requiredExp: 500 },
  { name: 'Bậc thầy Sáng tạo', color: '#C084FC', requiredExp: 1500 },
  { name: 'Huyền thoại Audition', color: '#FBBF24', requiredExp: 3000 },
  { name: 'Quản trị viên', color: '#FF4141', requiredExp: -1 },
];

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
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, 2600);
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
      sortBy: 'newest',
      currentPage: 'home',
      activePost: null,
      currentUser: null,
      isLoading: true,
      isLoadingMore: false,
      cmsConfig: loadCmsConfig(),
      brokenIds: loadBrokenIds(),
    };
    this.profileCache = new Map();
    this.fullPostCache = new Map();
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
        const { data } = await supabase.from('profiles').select('id,username,role,customTitle,customTitleColor,avatarUrl,exp').eq('id', session.user.id).single();
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
      // Trigger once-per-day DB smart view sync silently if SQL migration is active
      supabase.rpc('sync_daily_views').then(() => {}, () => {});

      const fetchImagesSafe = async () => {
        try {
          return await this.fetchAllRows((from, to) =>
            supabase.from('images')
              .select('id,title,image_url,thumbnail_url,views,created_at,thumbnail_crop_data,original_width,original_height,hashtags')
              .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to)
          );
        } catch {
          return await this.fetchAllRows((from, to) =>
            supabase.from('images')
              .select('id,title,image_url,thumbnail_url,views,created_at,thumbnail_crop_data,original_width,original_height')
              .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to)
          );
        }
      };

      const [catsRes, links, imgs, settingsRes, fallbackTagsMap] = await Promise.all([
        supabase.from('categories').select('id,name,position').order('position', { ascending: true }),
        this.fetchAllRows((from, to) =>
          supabase.from('image_categories').select('image_id,category_id').order('image_id').range(from, to)
        ),
        fetchImagesSafe(),
        supabase.from('app_settings').select('key,value').in('key', ['cms_config']),
        fetch('/hashtags-map.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      ]);

      if (!settingsRes?.error && settingsRes?.data?.length) {
        const cmsRow = settingsRes.data.find(r => r.key === 'cms_config')?.value;
        if (cmsRow) {
          this.state.cmsConfig = {
            welcome: { ...DEFAULT_CMS_CONFIG.welcome, ...(cmsRow.welcome || {}) },
            support: { ...DEFAULT_CMS_CONFIG.support, ...(cmsRow.support || {}) },
            seo: { ...DEFAULT_CMS_CONFIG.seo, ...(cmsRow.seo || {}) },
            privateIds: Array.isArray(cmsRow.privateIds) ? cmsRow.privateIds : [],
          };
          saveCmsConfig(this.state.cmsConfig);
        }
      }
      this.updateSeoMeta();

      if (catsRes.error) throw catsRes.error;
      this.state.categories = catsRes.data || [];
      const validIds = new Set(this.state.categories.map(c => c.id));
      const catLookup = new Map(this.state.categories.map(c => [c.id, c]));

      const map = new Map();
      links.forEach(l => {
        if (!validIds.has(l.category_id)) return;
        if (!map.has(l.image_id)) map.set(l.image_id, []);
        map.get(l.image_id).push(l.category_id);
      });
      this.state.imageCategoryMap = map;

      this.state.allImagesMeta = imgs.map(img => ({
        ...img,
        hashtags: (Array.isArray(img.hashtags) && img.hashtags.length) ? img.hashtags : (fallbackTagsMap[img.id] || []),
        categories: (map.get(img.id) || []).map(cid => catLookup.get(cid)).filter(Boolean),
      }));

      this.applyFilters();
    } catch (err) {
      console.error(err);
      showToast('Không thể tải dữ liệu: ' + err.message, 'error');
    } finally {
      this.state.isLoading = false;
      this.theme.renderLoading(this, false);
    }
  }

  markImageBroken(imageId) {
    const id = Number(imageId);
    if (this.state.brokenIds.has(id)) return;
    this.state.brokenIds.add(id);
    saveBrokenIds(this.state.brokenIds);
    const privateSet = new Set(this.state.cmsConfig.privateIds || []);
    if (!privateSet.has(id)) {
      this.state.cmsConfig.privateIds = [...privateSet, id];
      saveCmsConfig(this.state.cmsConfig);
    }
  }

  isPublicVisible(img) {
    const id = Number(img.id);
    if (this.state.brokenIds.has(id)) return false;
    if ((this.state.cmsConfig.privateIds || []).includes(id)) return false;
    return true;
  }

  getPublicImages() {
    return this.state.allImagesMeta.filter(img => this.isPublicVisible(img));
  }

  async ensureFullPost(idOrImg) {
    const id = typeof idOrImg === 'object' ? idOrImg.id : Number(idOrImg);
    if (this.fullPostCache.has(id)) return this.fullPostCache.get(id);

    let res = await supabase
      .from('images')
      .select('id,title,prompt,image_url,thumbnail_url,views,created_at,user_id,hashtags')
      .eq('id', id)
      .single();
    if (res.error) {
      res = await supabase
        .from('images')
        .select('id,title,prompt,image_url,thumbnail_url,views,created_at,user_id')
        .eq('id', id)
        .single();
    }
    const { data, error } = res;
    if (error || !data) throw new Error('Không tải được chi tiết bài đăng.');

    const meta = this.state.allImagesMeta.find(i => i.id === id);
    const full = {
      ...(meta || {}),
      ...data,
      categories: meta?.categories || [],
      hashtags: (Array.isArray(data.hashtags) && data.hashtags.length) ? data.hashtags : (meta?.hashtags || []),
    };
    full.profiles = await this.fetchAuthor(full.user_id);
    this.fullPostCache.set(id, full);
    return full;
  }

  async copyPromptById(idOrImg) {
    const full = await this.ensureFullPost(idOrImg);
    this.recordView(full);
    return copyText(full.prompt);
  }

  applyFilters() {
    const { selectedCategory, searchQuery, sortBy } = this.state;
    const rawQ = searchQuery.trim().toLowerCase();
    const normQ = normalizeVi(rawQ.replace(/^#/, ''));

    let list = this.getPublicImages().filter(img => {
      if (selectedCategory === 'uncategorized') {
        if (img.categories.length > 0) return false;
      } else if (selectedCategory !== 'all') {
        if (!img.categories.some(c => c.id === selectedCategory)) return false;
      }
      if (normQ) {
        const matchTitle = normalizeVi(img.title || '').includes(normQ);
        const matchCat = img.categories.some(c => normalizeVi(c.name).includes(normQ));
        const matchTags = Array.isArray(img.hashtags) && img.hashtags.some(t => normalizeVi(t).replace(/^#/, '').includes(normQ));
        const cachedFull = this.fullPostCache.get(img.id);
        const matchPrompt = cachedFull?.prompt ? normalizeVi(cachedFull.prompt).includes(normQ) : false;
        if (!matchTitle && !matchCat && !matchTags && !matchPrompt) return false;
      }
      return true;
    });

    if (sortBy === 'views') {
      list = [...list].sort((a, b) => getDisplayViews(b) - getDisplayViews(a));
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
    if (this.state.currentPage !== 'home') this.setPage('home');
    this.applyFilters();
    this.theme.renderPage(this);
  }

  setSearch(q) {
    this.state.searchQuery = q;
    if (this.state.currentPage !== 'home') this.setPage('home');
    this.applyFilters();
    this.theme.renderPage(this);
  }

  setSort(sortBy) {
    this.state.sortBy = sortBy;
    this.applyFilters();
  }

  updateSeoMeta(post = null) {
    const seo = this.state.cmsConfig?.seo || DEFAULT_CMS_CONFIG.seo;
    const setMeta = (selector, attr, val) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) el.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
        else if (selector.includes('name=')) el.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };
    const canonicalEl = document.head.querySelector('link[rel="canonical"]');

    if (post) {
      const title = `${post.title || 'Prompt AI'} | Prompt Audition AI`;
      const desc = (post.prompt || seo.siteDescription).replace(/\s+/g, ' ').trim().slice(0, 175);
      const imgUrl = post.image_url || post.thumbnail_url || seo.ogImage;
      const postUrl = this.getShareUrl(post, true);
      const tagStr = Array.isArray(post.hashtags) && post.hashtags.length ? post.hashtags.join(', ') : seo.keywords;

      document.title = title;
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[name="keywords"]', 'content', tagStr);
      setMeta('meta[property="og:type"]', 'content', 'article');
      setMeta('meta[property="og:title"]', 'content', title);
      setMeta('meta[property="og:description"]', 'content', desc);
      setMeta('meta[property="og:url"]', 'content', postUrl);
      setMeta('meta[property="og:image"]', 'content', imgUrl);
      setMeta('meta[property="og:image:secure_url"]', 'content', imgUrl);
      setMeta('meta[name="twitter:title"]', 'content', title);
      setMeta('meta[name="twitter:description"]', 'content', desc);
      setMeta('meta[name="twitter:image"]', 'content', imgUrl);
      if (canonicalEl) canonicalEl.setAttribute('href', postUrl);

      const ld = document.getElementById('seo-jsonld');
      if (ld) {
        ld.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ImageObject',
          name: post.title,
          description: desc,
          contentUrl: imgUrl,
          thumbnailUrl: post.thumbnail_url || imgUrl,
          url: postUrl,
          keywords: tagStr,
        });
      }
    } else {
      const base = seo.canonicalBase || window.location.origin + window.location.pathname;
      document.title = seo.siteTitle;
      setMeta('meta[name="description"]', 'content', seo.siteDescription);
      setMeta('meta[name="keywords"]', 'content', seo.keywords);
      setMeta('meta[property="og:type"]', 'content', 'website');
      setMeta('meta[property="og:title"]', 'content', seo.siteTitle);
      setMeta('meta[property="og:description"]', 'content', seo.siteDescription);
      setMeta('meta[property="og:url"]', 'content', base);
      setMeta('meta[property="og:image"]', 'content', seo.ogImage);
      setMeta('meta[property="og:image:secure_url"]', 'content', seo.ogImage);
      setMeta('meta[name="twitter:title"]', 'content', seo.siteTitle);
      setMeta('meta[name="twitter:description"]', 'content', seo.siteDescription);
      setMeta('meta[name="twitter:image"]', 'content', seo.ogImage);
      if (canonicalEl) canonicalEl.setAttribute('href', base);
    }
  }

  setPage(page) {
    this.state.currentPage = page;
    if (page === 'home') {
      const url = new URL(window.location.href);
      url.searchParams.delete('post');
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.pathname + url.search);
      this.updateSeoMeta(null);
    }
    this.theme.renderPage(this);
  }

  async fetchAuthor(userId) {
    if (!userId) return null;
    if (this.profileCache.has(userId)) return this.profileCache.get(userId);
    const { data } = await supabase.from('profiles').select('id,username,role,customTitle,customTitleColor,avatarUrl,exp').eq('id', userId).single();
    if (data) this.profileCache.set(userId, data);
    return data || null;
  }

  recordView(image) {
    image.views = (image.views || 0) + 1;
    const meta = this.state.allImagesMeta.find(i => i.id === image.id);
    if (meta && meta !== image) meta.views = (meta.views || 0) + 1;
    supabase.rpc('increment_image_views', { p_image_id: image.id }).then(() => {});
  }

  async openModal(image, sourceEl = null) {
    const url = new URL(window.location.href);
    url.searchParams.set('post', image.id);
    window.history.pushState({ postId: image.id, mode: 'modal' }, '', url.pathname + url.search);

    try {
      const full = await this.ensureFullPost(image);
      this.state.activePost = full;
      this.recordView(full);
      this.updateSeoMeta(full);
      this.theme.openDetailModal(this, full, sourceEl);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async openArticle(imageOrId) {
    try {
      const full = await this.ensureFullPost(imageOrId);
      const url = new URL(window.location.href);
      url.searchParams.set('post', full.id);
      url.searchParams.set('view', 'article');
      window.history.pushState({ postId: full.id, mode: 'article' }, '', url.pathname + url.search);

      this.recordView(full);
      this.state.activePost = full;
      this.state.currentPage = 'article';
      this.updateSeoMeta(full);
      this.theme.closeDetailModal(this);
      this.theme.renderPage(this);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      showToast('Không tìm thấy bài viết.', 'error');
    }
  }

  closeModal() {
    this.state.activePost = null;
    const url = new URL(window.location.href);
    url.searchParams.delete('post');
    url.searchParams.delete('view');
    window.history.replaceState({}, '', url.pathname + url.search);
    this.updateSeoMeta(null);
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
      if (view === 'article') this.openArticle(Number(postId));
      else this.openModal({ id: Number(postId) });
    }
  }

  async login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Sai email hoặc mật khẩu. Vui lòng kiểm tra lại hoặc bấm "Quên mật khẩu?".');
      }
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.');
      }
      throw error;
    }
    showToast('Đăng nhập thành công!');
  }

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}`
    });
    if (error) throw error;
    showToast('Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư.');
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

  async saveRemoteCmsConfig(cfg) {
    this.state.cmsConfig = cfg;
    saveCmsConfig(cfg);
    await supabase.from('app_settings').upsert({ key: 'cms_config', value: cfg, updated_at: new Date().toISOString() }).then(() => {}, () => {});
  }

  async uploadQrImage(file) {
    if (this.state.currentUser?.role !== 'admin') throw new Error('Chỉ Admin mới có quyền.');
    const ext = file.name.split('.').pop() || 'png';
    const stamp = `qr-${Date.now()}.${ext}`;
    return uploadToR2(file, 'images', stamp, file.type);
  }

  async updateProfile({ username, avatarUrl, avatarFile }) {
    if (!this.state.currentUser) throw new Error('Vui lòng đăng nhập.');
    let finalAvatar = avatarUrl;
    if (avatarFile) {
      if (avatarFile.size > 2 * 1024 * 1024) throw new Error('Ảnh đại diện phải nhỏ hơn 2MB.');
      const ext = avatarFile.name.split('.').pop() || 'png';
      finalAvatar = await uploadToR2(avatarFile, 'avatars', `${this.state.currentUser.id}-${Date.now()}.${ext}`, avatarFile.type);
    }
    const updates = { username: username.trim(), avatarUrl: finalAvatar || null };
    const { error } = await supabase.from('profiles').update(updates).eq('id', this.state.currentUser.id);
    if (error) throw error;
    this.state.currentUser = { ...this.state.currentUser, ...updates };
    this.profileCache.set(this.state.currentUser.id, this.state.currentUser);
    this.theme.renderAuth(this);
    showToast('Cập nhật thông tin tài khoản thành công!');
  }

  async changePassword(newPass) {
    if (!newPass || newPass.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
    showToast('Đổi mật khẩu thành công!');
  }

  async fetchAllUsersAdmin() {
    if (this.state.currentUser?.role !== 'admin') throw new Error('Chỉ Admin mới có quyền.');
    const { data, error } = await supabase.from('profiles').select('id,username,role,customTitle,customTitleColor,avatarUrl,exp').order('exp', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateUserAdmin(userId, updates) {
    if (this.state.currentUser?.role !== 'admin') throw new Error('Chỉ Admin mới có quyền.');
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
    this.profileCache.delete(userId);
    if (this.state.currentUser.id === userId) {
      this.state.currentUser = { ...this.state.currentUser, ...updates };
      this.theme.renderAuth(this);
    }
    showToast('Đã cập nhật thành viên!');
  }

  async createCategoryAdmin(name) {
    if (this.state.currentUser?.role !== 'admin') throw new Error('Chỉ Admin mới có quyền.');
    const nextPos = (this.state.categories.reduce((m, c) => Math.max(m, c.position || 0), 0)) + 1;
    const { error } = await supabase.from('categories').insert({ name: name.trim(), position: nextPos });
    if (error) throw error;
    showToast(`Đã thêm chuyên mục "${name.trim()}"!`);
    await this.fetchInitialData();
  }

  async deleteCategoryAdmin(catId) {
    if (this.state.currentUser?.role !== 'admin') throw new Error('Chỉ Admin mới có quyền.');
    await supabase.from('image_categories').delete().eq('category_id', catId);
    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) throw error;
    showToast('Đã xóa chuyên mục!');
    await this.fetchInitialData();
  }

  async replaceImageFile(imageId, file) {
    if (this.state.currentUser?.role !== 'admin') throw new Error('Chỉ Admin mới có quyền.');
    const ext = file.name.split('.').pop() || 'png';
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const imageUrl = await uploadToR2(file, 'images', `${stamp}.${ext}`, file.type);
    const thumbBlob = await createThumbnailWebP(file);
    const thumbnailUrl = await uploadToR2(thumbBlob, 'images', `${stamp}.webp`, 'image/webp');

    const { error } = await supabase.from('images').update({ image_url: imageUrl, thumbnail_url: thumbnailUrl }).eq('id', imageId);
    if (error) throw error;

    this.state.brokenIds.delete(Number(imageId));
    saveBrokenIds(this.state.brokenIds);
    this.state.cmsConfig.privateIds = (this.state.cmsConfig.privateIds || []).filter(id => id !== Number(imageId));
    saveCmsConfig(this.state.cmsConfig);
    this.fullPostCache.delete(Number(imageId));
    showToast(`Đã thay ảnh mới cho #${imageId} và đưa về công khai!`);
    await this.fetchInitialData();
  }

  async deletePost(image) {
    const { error } = await supabase.from('images').delete().eq('id', image.id);
    if (error) throw error;
    this.fullPostCache.delete(image.id);
    showToast('Đã xóa bài đăng!');
    this.closeModal();
    if (this.state.currentPage === 'article') this.setPage('home');
    await this.fetchInitialData();
  }
}
