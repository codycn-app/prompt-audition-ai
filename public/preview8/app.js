import { PromptAppEngine, escapeHtml, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div class="rl-top-float">
        <div class="rl-pill-bar">
          <strong style="font-family:var(--font-display);cursor:pointer;color:var(--accent-2);" id="rl-logo">REELS.AI</strong>
          <select id="rl-cat-sel" style="background:transparent;color:#fff;border:none;font-size:13px;font-weight:600;outline:none;cursor:pointer;"></select>
        </div>
        <div class="rl-pill-bar" style="flex:1;max-width:300px;">
          <span style="width:14px;height:14px;color:var(--text-muted);">${ICONS.search}</span>
          <input id="rl-search" type="search" placeholder="Tìm nhanh..." style="background:none;border:none;color:#fff;font-size:13px;outline:none;width:100%;" />
        </div>
        <div class="rl-pill-bar rl-hide-mob">
          <button class="uk-btn" id="rl-sup" style="padding:5px 10px;border:none;">${ICONS.heart}</button>
          <button class="uk-btn uk-btn-primary" id="rl-add" style="padding:6px 12px;">${ICONS.plus} Thêm</button>
          <div id="rl-auth"></div>
        </div>
      </div>

      <main id="rl-main">
        <div class="rl-feed" id="rl-feed"></div>
      </main>

      <nav class="pc-mobile-dock" style="background:rgba(10,10,14,0.88);backdrop-filter:blur(16px);border-top:1px solid var(--border);">
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Reels</span></button>
        <button class="uk-btn uk-btn-primary" style="width:44px;height:44px;border-radius:999px;margin:0 auto;padding:0;" id="rl-mob-add">${ICONS.plus}</button>
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Cá nhân</span></button>
      </nav>
    `;
    document.getElementById('rl-logo').onclick = () => engine.setCategory('all');
    document.getElementById('rl-sup').onclick = () => engine.setPage('support');
    document.getElementById('rl-add').onclick = () => openAddModal(engine);
    document.getElementById('rl-mob-add').onclick = () => openAddModal(engine);
    let t;
    document.getElementById('rl-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('rl-auth'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="rl-u" style="padding:5px 10px;border:none;">${escapeHtml(u.username)}</button>` : `<button class="uk-btn" id="rl-l" style="padding:5px 10px;border:none;">Đăng nhập</button>`;
    if (u) s.querySelector('#rl-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#rl-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('rl-feed').innerHTML = `<div class="rl-slide"><div style="color:var(--text-muted);">Đang tải Reels AI...</div></div>`;
  },
  renderCategories(engine) {
    const sel = document.getElementById('rl-cat-sel'); if (!sel) return;
    const { categories, selectedCategory } = engine.state;
    sel.innerHTML = [`<option value="all" style="background:#111;">Tất cả chuyên mục</option>`,
      ...categories.map(c => `<option value="${c.id}" style="background:#111;" ${selectedCategory === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`)].join('');
    sel.onchange = () => engine.setCategory(sel.value === 'all' ? 'all' : Number(sel.value));
  },
  renderGallery(engine) {
    const feed = document.getElementById('rl-feed'); if (!feed) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    if (!loadedImages.length) {
      feed.innerHTML = `<div class="rl-slide"><div style="color:var(--text-muted);">Không tìm thấy kết quả.</div></div>`;
      return;
    }
    feed.innerHTML = loadedImages.map((img, i) => `
      <section class="rl-slide">
        <div class="rl-card">
          <div class="rl-media"><img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.title)}" loading="lazy" /></div>
          <div class="rl-info">
            <div style="font-size:12px;color:var(--accent-2);">#${img.id} • Cuộn xuống để xem tiếp (${i + 1}/${loadedImages.length})</div>
            <h2 style="margin:0;font-family:var(--font-display);font-size:22px;">${escapeHtml(img.title)}</h2>
            <div class="uk-prompt-box" style="flex:1;">${escapeHtml(img.prompt)}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="uk-btn uk-btn-primary" data-copy="${img.id}">${ICONS.copy} Sao chép Prompt</button>
              <button class="uk-btn" data-art="${img.id}">${ICONS.article} Mở bài viết</button>
              <button class="uk-btn" data-mod="${img.id}">${ICONS.eye} Chi tiết</button>
            </div>
          </div>
        </div>
      </section>
    `).join('') + (hasMore ? `<section class="rl-slide"><button class="uk-btn uk-btn-primary" id="rl-more">Tải thêm (${filteredImages.length - loadedImages.length})</button></section>` : '');

    feed.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => {
      const item = loadedImages.find(i => i.id === Number(b.dataset.copy));
      if (item) copyText(item.prompt);
    });
    feed.querySelectorAll('[data-art]').forEach(b => b.onclick = () => {
      const item = loadedImages.find(i => i.id === Number(b.dataset.art));
      if (item) engine.openArticle(item);
    });
    feed.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => {
      const item = loadedImages.find(i => i.id === Number(b.dataset.mod));
      if (item) engine.openModal(item);
    });
    if (hasMore) feed.querySelector('#rl-more').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('rl-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) {
      main.style.paddingTop = '64px'; renderArticleView(main, engine, engine.state.activePost);
    } else if (engine.state.currentPage === 'support') {
      main.style.paddingTop = '64px'; renderSupportView(main, engine);
    } else if (engine.state.currentPage === 'profile') {
      main.style.paddingTop = '64px'; renderProfileView(main, engine);
    } else {
      main.style.paddingTop = '0'; main.innerHTML = `<div class="rl-feed" id="rl-feed"></div>`;
      this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
