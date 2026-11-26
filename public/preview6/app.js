import { PromptAppEngine, escapeHtml, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div class="pin-layout">
        <aside class="pin-rail">
          <button class="pin-rail-btn active" id="pin-logo" title="Trang chủ">${ICONS.sparkles}</button>
          <button class="pin-rail-btn" data-nav="home" title="Khám phá">${ICONS.home}</button>
          <button class="pin-rail-btn" id="pin-rail-add" title="Thêm Prompt mới" style="background:var(--accent);color:#fff;">${ICONS.plus}</button>
          <button class="pin-rail-btn" data-nav="support" title="Ủng hộ">${ICONS.heart}</button>
          <div style="margin-top:auto;" id="pin-rail-auth"></div>
        </aside>

        <div class="pin-body">
          <div class="pin-topbar">
            <div style="flex:1;position:relative;display:flex;align-items:center;">
              <span style="position:absolute;left:14px;width:16px;height:16px;color:var(--text-muted);">${ICONS.search}</span>
              <input class="uk-input" id="pin-search" type="search" placeholder="Tìm kiếm ý tưởng ảnh AI..." style="padding-left:40px;border-radius:999px;background:var(--surface-2);color:var(--text);border:none;" />
            </div>
            <select class="uk-input" id="pin-sort" style="width:auto;border-radius:999px;padding:9px 14px;font-size:13px;background:var(--surface-2);color:var(--text);border:none;">
              <option value="newest">Mới nhất</option><option value="views">Phổ biến</option>
            </select>
          </div>
          <main id="pin-main">
            <div class="pin-cats" id="pin-cats"></div>
            <div class="pin-masonry" id="pin-grid"></div>
            <div id="pin-more" style="text-align:center;margin-top:20px;"></div>
          </main>
        </div>
      </div>
      <nav class="pc-mobile-dock" style="background:#fff;border-top:1px solid var(--border);">
        <button class="uk-btn" style="background:none;border:none;color:#0f172a;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Trang chủ</span></button>
        <button class="uk-btn uk-btn-primary" style="width:44px;height:44px;border-radius:999px;margin:0 auto;padding:0;" id="pin-mob-add">${ICONS.plus}</button>
        <button class="uk-btn" style="background:none;border:none;color:#0f172a;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
        <button class="uk-btn" style="background:none;border:none;color:#0f172a;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Cá nhân</span></button>
      </nav>
    `;
    document.getElementById('pin-logo').onclick = () => engine.setCategory('all');
    document.getElementById('pin-rail-add').onclick = () => openAddModal(engine);
    document.getElementById('pin-mob-add').onclick = () => openAddModal(engine);
    document.getElementById('pin-sort').onchange = (e) => engine.setSort(e.target.value);
    let t;
    document.getElementById('pin-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('pin-rail-auth'); const u = engine.state.currentUser;
    s.innerHTML = `<button class="pin-rail-btn" id="pin-u" title="${u ? escapeHtml(u.username) : 'Đăng nhập'}">${ICONS.user}</button>`;
    s.querySelector('#pin-u').onclick = () => u ? engine.setPage('profile') : openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('pin-grid').innerHTML = Array.from({ length: 10 }, (_, i) => `<div class="pin-item" style="height:${220 + (i % 3) * 60}px;opacity:0.5;"></div>`).join('');
  },
  renderCategories(engine) {
    const w = document.getElementById('pin-cats'); if (!w) return;
    const { categories, selectedCategory } = engine.state;
    w.innerHTML = [`<button class="pin-pill ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả</button>`,
      ...categories.map(c => `<button class="pin-pill ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
  },
  renderGallery(engine) {
    const g = document.getElementById('pin-grid'); const m = document.getElementById('pin-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    g.innerHTML = loadedImages.map(img => `
      <div class="pin-item" data-id="${img.id}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" loading="lazy" />
        <div class="pin-item-hover">
          <div style="display:flex;justify-content:flex-end;">
            <button class="uk-btn uk-btn-primary" data-copy="${img.id}" style="padding:7px 12px;font-size:12px;">${ICONS.copy} Lưu Prompt</button>
          </div>
          <div style="color:#fff;font-size:13px;font-weight:700;text-shadow:0 2px 6px rgba(0,0,0,0.8);">${escapeHtml(img.title)}</div>
        </div>
      </div>`).join('');
    g.querySelectorAll('.pin-item').forEach(c => c.onclick = (e) => {
      if (e.target.closest('[data-copy]')) return;
      const item = loadedImages.find(i => i.id === Number(c.dataset.id));
      if (item) engine.openModal(item, c);
    });
    g.querySelectorAll('[data-copy]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const item = loadedImages.find(i => i.id === Number(b.dataset.copy));
      if (item) copyText(item.prompt);
    });
    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="pin-more-btn">Xem thêm (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#pin-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('pin-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `<div class="pin-cats" id="pin-cats"></div><div class="pin-masonry" id="pin-grid"></div><div id="pin-more" style="text-align:center;margin-top:20px;"></div>`;
      this.renderCategories(engine); this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
