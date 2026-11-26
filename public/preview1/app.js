import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

const LOGO_SVG = `
<svg class="os-logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="prismGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#A855F7"/>
      <stop offset="100%" stop-color="#F472B6"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#prismGrad)" fill-opacity="0.18" stroke="url(#prismGrad)" stroke-width="1.6"/>
  <path d="M20 7L31 15.5L26.5 31H13.5L9 15.5L20 7Z" fill="url(#prismGrad)" fill-opacity="0.28" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M20 7V31M9 15.5H31M13.5 31L20 15.5L26.5 31" stroke="#38BDF8" stroke-opacity="0.8" stroke-width="1.2"/>
  <circle cx="20" cy="15.5" r="2.6" fill="#FFFFFF"/>
</svg>`;

const CAT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div class="os-root">
        <header class="os-menubar">
          <div class="os-brand" id="os-logo">
            ${LOGO_SVG}
            <span class="os-brand-text">Prompt Audition AI</span>
          </div>
          <div class="os-top-search">
            ${ICONS.search}
            <input id="os-search" type="search" placeholder="Tìm câu lệnh, phong cách..." />
            <span class="os-kbd">Ctrl K</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="uk-btn os-hide-mob" id="os-sup">${ICONS.heart} <span>Ủng hộ</span></button>
            <button class="uk-btn uk-btn-primary os-hide-mob" id="os-add">${ICONS.plus} <span>Thêm mới</span></button>
            <div id="os-auth-top"></div>
          </div>
        </header>

        <main class="os-desktop" id="os-main">
          <section class="os-hero-banner">
            <div class="os-hero-inner">
              <div class="os-hero-copy">
                <div class="os-hero-badge"><span class="os-hero-dot"></span> <span id="os-count-label">Kho câu lệnh AI cộng đồng</span></div>
                <h1 style="margin:0 0 10px;font-family:var(--font-display);font-size:clamp(24px,3.2vw,38px);line-height:1.15;">Thư viện Câu Lệnh Tạo Ảnh AI</h1>
                <p style="margin:0 0 18px;font-size:14px;color:var(--text-muted);line-height:1.65;max-width:540px;">Khám phá hàng nghìn câu lệnh tuyển chọn, sao chép nhanh trực tiếp trên ảnh hoặc mở xem kích thước gốc kèm link chia sẻ bài viết.</p>
                <div class="os-hero-meta">
                  <select class="uk-input" id="os-sort" style="width:auto;padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;">
                    <option value="newest">Sắp xếp: Mới nhất</option>
                    <option value="views">Sắp xếp: Xem nhiều nhất</option>
                  </select>
                  <span class="os-stat-chip">${ICONS.sparkles.replace('<svg', '<svg style="width:14px;height:14px;color:var(--accent);"')} Ảnh gốc sắc nét</span>
                </div>
              </div>
              <div class="os-featured-strip" id="os-featured"></div>
            </div>
          </section>

          <section class="os-library-win">
            <div class="os-cat-bar">
              <div class="os-cats-scroll" id="os-cats"></div>
            </div>
            <div class="os-grid" id="os-grid"></div>
            <div id="os-more" style="text-align:center;padding:10px 18px 26px;"></div>
          </section>
        </main>

        <div class="os-dock-wrap">
          <div class="os-dock-popover pc-hidden" id="os-cat-popover"></div>
          <nav class="os-dock" aria-label="Thanh điều hướng nhanh">
            <button class="os-dock-item" title="Trang chủ" data-dock="home">${ICONS.home}</button>
            <button class="os-dock-item" title="Chọn chuyên mục" id="os-dock-cats">${CAT_ICON}</button>
            <div class="os-dock-sep"></div>
            <button class="os-dock-item primary" title="Thêm Prompt mới" id="os-dock-add">${ICONS.plus}</button>
            <div class="os-dock-sep"></div>
            <button class="os-dock-item" title="Ủng hộ" data-dock="support">${ICONS.heart}</button>
            <button class="os-dock-item" title="Tài khoản" data-dock="profile">${ICONS.user}</button>
          </nav>
        </div>
      </div>
    `;

    this.bindControls(engine);
  },

  bindControls(engine) {
    document.getElementById('os-logo').onclick = () => engine.setCategory('all');
    document.getElementById('os-sup').onclick = () => engine.setPage('support');
    document.getElementById('os-add').onclick = () => openAddModal(engine);
    document.getElementById('os-dock-add').onclick = () => openAddModal(engine);
    document.getElementById('os-sort').onchange = (e) => engine.setSort(e.target.value);

    const pop = document.getElementById('os-cat-popover');
    document.getElementById('os-dock-cats').onclick = () => pop.classList.toggle('pc-hidden');

    const searchInput = document.getElementById('os-search');
    let t;
    searchInput.addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput.focus(); } });

    document.querySelectorAll('[data-dock]').forEach(b => b.onclick = () => {
      pop.classList.add('pc-hidden');
      if (b.dataset.dock === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.dock);
    });
  },

  renderAuth(engine) {
    const s = document.getElementById('os-auth-top'); const u = engine.state.currentUser;
    s.innerHTML = u
      ? `<button class="uk-btn" id="os-u">${ICONS.user} <span>${escapeHtml(u.username)}</span></button>`
      : `<button class="uk-btn os-hide-mob" id="os-l">Đăng nhập</button>`;
    if (u) s.querySelector('#os-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#os-l').onclick = () => openAuthModal(engine, 'login');
  },

  renderLoading(engine, l) {
    if (!l) return;
    document.getElementById('os-grid').innerHTML = Array.from({ length: 14 }, () => `<div class="os-tile" style="opacity:0.35;"></div>`).join('');
  },

  renderCategories(engine) {
    const { categories, selectedCategory, allImagesMeta } = engine.state;
    const html = [
      `<button class="os-cat-pill ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả (${allImagesMeta.length})</button>`,
      ...categories.map(c => `<button class="os-cat-pill ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)
    ].join('');

    const bar = document.getElementById('os-cats');
    const pop = document.getElementById('os-cat-popover');
    if (bar) {
      bar.innerHTML = html;
      bar.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
    }
    if (pop) {
      pop.innerHTML = html;
      pop.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => {
        pop.classList.add('pc-hidden');
        engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat));
      });
    }
  },

  renderGallery(engine) {
    const lbl = document.getElementById('os-count-label');
    if (lbl) lbl.textContent = `${engine.state.allImagesMeta.length} Câu lệnh AI đang hoạt động`;

    const feat = document.getElementById('os-featured');
    if (feat && engine.state.allImagesMeta.length) {
      const top3 = [...engine.state.allImagesMeta].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
      feat.innerHTML = top3.map((img, idx) => `
        <div class="os-feat-card" data-fid="${img.id}">
          <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" />
          <span class="os-feat-rank">#${idx + 1} HOT</span>
        </div>`).join('');
      feat.querySelectorAll('.os-feat-card').forEach(c => c.onclick = () => {
        const item = top3.find(i => i.id === Number(c.dataset.fid));
        if (item) engine.openModal(item, c);
      });
    }

    const g = document.getElementById('os-grid'); const m = document.getElementById('os-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    if (!loadedImages.length) {
      g.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:56px 16px;color:var(--text-muted);">Không tìm thấy câu lệnh nào phù hợp.</div>`;
      m.innerHTML = '';
      return;
    }

    g.innerHTML = loadedImages.map(img => `
      <div class="os-tile" data-id="${img.id}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
        <button class="os-copy-pill" data-copy="${img.id}" title="Sao chép Prompt">${ICONS.copy}<span>Copy Prompt</span></button>
      </div>`).join('');

    gsap.fromTo('.os-tile', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.018, ease: 'power2.out' });

    g.querySelectorAll('.os-tile').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('[data-copy]')) return;
        const item = loadedImages.find(i => i.id === Number(card.dataset.id));
        if (item) engine.openModal(item, card);
      };
    });

    g.querySelectorAll('[data-copy]').forEach(b => b.onclick = async (e) => {
      e.stopPropagation();
      const item = loadedImages.find(i => i.id === Number(b.dataset.copy));
      if (item && await copyText(item.prompt)) {
        b.innerHTML = `${ICONS.check}<span>Đã chép!</span>`;
        setTimeout(() => { if (b.isConnected) b.innerHTML = `${ICONS.copy}<span>Copy Prompt</span>`; }, 1500);
      }
    });

    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="os-more-btn">Xem thêm (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#os-more-btn').onclick = () => engine.loadMore();
  },

  renderPage(engine) {
    const main = document.getElementById('os-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `
        <section class="os-hero-banner"><div class="os-hero-inner"><div class="os-hero-copy"><div class="os-hero-badge"><span class="os-hero-dot"></span> <span id="os-count-label">Kho câu lệnh AI cộng đồng</span></div><h1 style="margin:0 0 10px;font-family:var(--font-display);font-size:clamp(24px,3.2vw,38px);line-height:1.15;">Thư viện Câu Lệnh Tạo Ảnh AI</h1><p style="margin:0 0 18px;font-size:14px;color:var(--text-muted);line-height:1.65;max-width:540px;">Khám phá hàng nghìn câu lệnh tuyển chọn, sao chép nhanh trực tiếp trên ảnh hoặc mở xem kích thước gốc kèm link chia sẻ bài viết.</p><div class="os-hero-meta"><select class="uk-input" id="os-sort" style="width:auto;padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;"><option value="newest" ${engine.state.sortBy === 'newest' ? 'selected' : ''}>Sắp xếp: Mới nhất</option><option value="views" ${engine.state.sortBy === 'views' ? 'selected' : ''}>Sắp xếp: Xem nhiều nhất</option></select><span class="os-stat-chip">${ICONS.sparkles.replace('<svg', '<svg style="width:14px;height:14px;color:var(--accent);"')} Ảnh gốc sắc nét</span></div></div><div class="os-featured-strip" id="os-featured"></div></div></section>
        <section class="os-library-win"><div class="os-cat-bar"><div class="os-cats-scroll" id="os-cats"></div></div><div class="os-grid" id="os-grid"></div><div id="os-more" style="text-align:center;padding:10px 18px 26px;"></div></section>
      `;
      main.querySelector('#os-sort').onchange = (e) => engine.setSort(e.target.value);
      this.renderCategories(engine);
      this.renderGallery(engine);
    }
  },

  openDetailModal(engine, image) {
    renderDetailModal(engine, image, {
      onModalMount(modal) {
        gsap.fromTo(modal.querySelector('.pc-modal-card'), { scale: 0.92, opacity: 0, y: 16 }, { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
      }
    });
  },
  closeDetailModal() { closeDetailModal(); }
};

new PromptAppEngine(adapter).init();
