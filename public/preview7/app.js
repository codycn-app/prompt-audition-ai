import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

let selectedId = null;

function renderInspector(engine, img) {
  const pane = document.getElementById('ide-inspector');
  if (!pane || !img) return;
  selectedId = img.id;
  pane.innerHTML = `
    <div style="font-family:var(--font-display);font-size:11px;color:var(--accent);text-transform:uppercase;">INSPECTOR // #${img.id}</div>
    <div style="border-radius:10px;overflow:hidden;background:#05070a;border:1px solid var(--border);max-height:260px;">
      <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.title)}" style="width:100%;height:240px;object-fit:contain;display:block;" />
    </div>
    <strong style="font-size:16px;">${escapeHtml(img.title)}</strong>
    <div style="font-family:var(--font-display);font-size:12px;line-height:1.6;color:#cbd5e1;background:#080a0f;border:1px solid var(--border);padding:12px;border-radius:8px;max-height:200px;overflow-y:auto;">${escapeHtml(img.prompt)}</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="uk-btn uk-btn-primary" id="ide-ins-copy">${ICONS.copy} Sao chép Prompt</button>
      <div style="display:flex;gap:8px;">
        <button class="uk-btn" id="ide-ins-modal" style="flex:1;">${ICONS.eye} Phóng to</button>
        <button class="uk-btn" id="ide-ins-art" style="flex:1;">${ICONS.article} Bài viết</button>
      </div>
    </div>
  `;
  pane.querySelector('#ide-ins-copy').onclick = () => copyText(img.prompt);
  pane.querySelector('#ide-ins-modal').onclick = () => engine.openModal(img);
  pane.querySelector('#ide-ins-art').onclick = () => engine.openArticle(img);
}

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div class="ide-shell">
        <header class="ide-titlebar">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--accent);cursor:pointer;" id="ide-logo">PROMPT.STUDIO // IDE</div>
          <div style="flex:1;max-width:400px;position:relative;display:flex;align-items:center;">
            <span style="position:absolute;left:10px;width:14px;height:14px;color:var(--text-muted);">${ICONS.search}</span>
            <input class="uk-input" id="ide-search" type="search" placeholder="Search prompts..." style="padding:5px 10px 5px 32px;font-size:12.5px;" />
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="ide-hide-mob" style="display:flex;gap:4px;">
              <button class="uk-btn" data-zoom="5" style="padding:4px 8px;font-size:11px;">S</button>
              <button class="uk-btn" data-zoom="4" style="padding:4px 8px;font-size:11px;">M</button>
              <button class="uk-btn" data-zoom="3" style="padding:4px 8px;font-size:11px;">L</button>
            </div>
            <button class="uk-btn ide-hide-mob" id="ide-sup" style="padding:5px 10px;font-size:12px;">${ICONS.heart} Ủng hộ</button>
            <button class="uk-btn uk-btn-primary ide-hide-mob" id="ide-add" style="padding:5px 10px;font-size:12px;">${ICONS.plus} New</button>
            <div id="ide-auth"></div>
          </div>
        </header>

        <div class="ide-panes" id="ide-main">
          <aside class="ide-left">
            <div style="font-family:var(--font-display);font-size:11px;color:var(--text-muted);padding:4px 8px;">EXPLORER / CATEGORIES</div>
            <div id="ide-cats"></div>
          </aside>
          <section class="ide-center">
            <div class="ide-grid" id="ide-grid"></div>
            <div id="ide-more" style="text-align:center;margin-top:18px;"></div>
          </section>
          <aside class="ide-right" id="ide-inspector">
            <div style="color:var(--text-muted);font-size:13px;margin:auto;text-align:center;">Chọn 1 ảnh để xem nhanh Prompt tại Inspector</div>
          </aside>
        </div>

        <nav class="pc-mobile-dock" style="background:#080a0f;border-top:1px solid var(--border);">
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Studio</span></button>
          <button class="uk-btn uk-btn-primary" style="width:42px;height:42px;margin:0 auto;padding:0;" id="ide-mob-add">${ICONS.plus}</button>
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Cá nhân</span></button>
        </nav>
      </div>
    `;
    document.getElementById('ide-logo').onclick = () => engine.setCategory('all');
    document.getElementById('ide-sup').onclick = () => engine.setPage('support');
    document.getElementById('ide-add').onclick = () => openAddModal(engine);
    document.getElementById('ide-mob-add').onclick = () => openAddModal(engine);
    document.querySelectorAll('[data-zoom]').forEach(b => b.onclick = () => {
      document.getElementById('ide-grid')?.style.setProperty('--cols', b.dataset.zoom);
    });
    let t;
    document.getElementById('ide-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('ide-auth'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="ide-u" style="padding:4px 10px;font-size:12px;">${escapeHtml(u.username)}</button>` : `<button class="uk-btn ide-hide-mob" id="ide-l" style="padding:4px 10px;font-size:12px;">Login</button>`;
    if (u) s.querySelector('#ide-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#ide-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('ide-grid').innerHTML = Array.from({ length: 12 }, () => `<div class="ide-cell" style="opacity:0.3;"></div>`).join('');
  },
  renderCategories(engine) {
    const w = document.getElementById('ide-cats'); if (!w) return;
    const { categories, selectedCategory, allImagesMeta } = engine.state;
    w.innerHTML = [`<button class="ide-tree-item ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all"><span>📁 Tất cả</span><span>${allImagesMeta.length}</span></button>`,
      ...categories.map(c => `<button class="ide-tree-item ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}"><span>📄 ${escapeHtml(c.name)}</span></button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
  },
  renderGallery(engine) {
    const g = document.getElementById('ide-grid'); const m = document.getElementById('ide-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    if (loadedImages.length && !selectedId) renderInspector(engine, loadedImages[0]);

    g.innerHTML = loadedImages.map(img => `
      <div class="ide-cell ${img.id === selectedId ? 'selected' : ''}" data-id="${img.id}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
      </div>`).join('');
    g.querySelectorAll('.ide-cell').forEach(c => {
      c.onclick = () => {
        const item = loadedImages.find(i => i.id === Number(c.dataset.id));
        if (!item) return;
        if (window.innerWidth < 1180) { engine.openModal(item, c); return; }
        g.querySelectorAll('.ide-cell').forEach(x => x.classList.remove('selected'));
        c.classList.add('selected');
        renderInspector(engine, item);
      };
      c.ondblclick = () => {
        const item = loadedImages.find(i => i.id === Number(c.dataset.id));
        if (item) engine.openModal(item, c);
      };
    });
    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="ide-more-btn">Load More (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#ide-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('ide-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) {
      main.style.display = 'block'; main.style.overflowY = 'auto';
      renderArticleView(main, engine, engine.state.activePost);
    } else if (engine.state.currentPage === 'support') {
      main.style.display = 'block'; main.style.overflowY = 'auto';
      renderSupportView(main, engine);
    } else if (engine.state.currentPage === 'profile') {
      main.style.display = 'block'; main.style.overflowY = 'auto';
      renderProfileView(main, engine);
    } else {
      main.style.display = 'flex'; main.style.overflowY = 'hidden';
      main.innerHTML = `<aside class="ide-left"><div style="font-family:var(--font-display);font-size:11px;color:var(--text-muted);padding:4px 8px;">EXPLORER / CATEGORIES</div><div id="ide-cats"></div></aside><section class="ide-center"><div class="ide-grid" id="ide-grid"></div><div id="ide-more" style="text-align:center;margin-top:18px;"></div></section><aside class="ide-right" id="ide-inspector"></aside>`;
      this.renderCategories(engine); this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
