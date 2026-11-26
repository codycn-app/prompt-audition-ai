import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

let hoveredPost = null;

function updateStage(engine, img) {
  if (!img) return;
  hoveredPost = img;
  const host = document.getElementById('sp2-stage-box');
  if (!host) return;
  host.innerHTML = `
    <div class="sp2-stage-img-wrap">
      <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.title)}" />
    </div>
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <strong style="font-family:var(--font-display);font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</strong>
        <span style="font-size:12px;color:var(--accent-2);">#${img.id}</span>
      </div>
      <div class="sp2-stage-prompt">${escapeHtml(img.prompt)}</div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <button class="uk-btn uk-btn-primary" id="sp2-st-copy">${ICONS.copy} Sao chép Prompt</button>
        <button class="uk-btn" id="sp2-st-art">${ICONS.article} Mở bài viết</button>
      </div>
    </div>
  `;
  host.querySelector('#sp2-st-copy').onclick = () => copyText(img.prompt);
  host.querySelector('#sp2-st-art').onclick = () => engine.openArticle(img);
}

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div class="sp2-split">
        <aside class="sp2-left-stage">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-family:var(--font-display);font-size:20px;font-weight:700;cursor:pointer;background:linear-gradient(90deg,#ff00e6,#00f0ff);-webkit-background-clip:text;color:transparent;" id="sp2-logo">AUDITION STAGE</div>
            <div style="display:flex;gap:6px;">
              <button class="uk-btn sp2-hide-mob" id="sp2-sup" style="padding:6px 10px;">${ICONS.heart}</button>
              <button class="uk-btn uk-btn-primary sp2-hide-mob" id="sp2-add" style="padding:6px 12px;">${ICONS.plus} Thêm</button>
            </div>
          </div>
          <div class="sp2-preview-frame" id="sp2-stage-box">
            <div style="padding:40px;text-align:center;color:var(--text-muted);">Rê chuột vào ảnh bên phải để xem trực tiếp Prompt tại sân khấu này...</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-muted);">
            <span>Hover ảnh để xem nhanh • Click để mở</span>
            <div id="sp2-auth"></div>
          </div>
        </aside>

        <div class="sp2-right-feed" id="sp2-main">
          <div class="sp2-controls">
            <div style="flex:1;min-width:200px;position:relative;display:flex;align-items:center;">
              <span style="position:absolute;left:12px;width:15px;height:15px;color:var(--text-muted);">${ICONS.search}</span>
              <input class="uk-input" id="sp2-search" type="search" placeholder="Tìm câu lệnh AI..." style="padding-left:36px;" />
            </div>
            <select class="uk-input" id="sp2-sort" style="width:auto;padding:9px 12px;font-size:13px;">
              <option value="newest">Mới nhất</option><option value="views">Hot nhất</option>
            </select>
          </div>
          <div class="sp2-cats" id="sp2-cats"></div>
          <div class="sp2-grid" id="sp2-grid"></div>
          <div id="sp2-more" style="text-align:center;margin-top:22px;"></div>
        </div>
      </div>
      <nav class="pc-mobile-dock" style="background:rgba(12,8,22,0.92);backdrop-filter:blur(16px);border-top:1px solid var(--border);">
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Trang chủ</span></button>
        <button class="uk-btn uk-btn-primary" style="width:44px;height:44px;border-radius:12px;margin:0 auto;padding:0;" id="sp2-mob-add">${ICONS.plus}</button>
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Cá nhân</span></button>
      </nav>
    `;
    document.getElementById('sp2-logo').onclick = () => engine.setCategory('all');
    document.getElementById('sp2-sup').onclick = () => engine.setPage('support');
    document.getElementById('sp2-add').onclick = () => openAddModal(engine);
    document.getElementById('sp2-mob-add').onclick = () => openAddModal(engine);
    document.getElementById('sp2-sort').onchange = (e) => engine.setSort(e.target.value);
    let t;
    document.getElementById('sp2-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('sp2-auth'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="sp2-u" style="padding:5px 10px;">${ICONS.user} ${escapeHtml(u.username)}</button>` : `<button class="uk-btn sp2-hide-mob" id="sp2-l" style="padding:5px 12px;">Đăng nhập</button>`;
    if (u) s.querySelector('#sp2-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#sp2-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (!l) return;
    document.getElementById('sp2-grid').innerHTML = Array.from({ length: 9 }, () => `<div class="sp2-card" style="opacity:0.35;"></div>`).join('');
  },
  renderCategories(engine) {
    const w = document.getElementById('sp2-cats'); if (!w) return;
    const { categories, selectedCategory } = engine.state;
    w.innerHTML = [`<button class="sp2-pill ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả</button>`,
      ...categories.map(c => `<button class="sp2-pill ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
  },
  renderGallery(engine) {
    const g = document.getElementById('sp2-grid'); const m = document.getElementById('sp2-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    if (loadedImages.length && !hoveredPost) updateStage(engine, loadedImages[0]);

    g.innerHTML = loadedImages.map(img => `
      <div class="sp2-card" data-id="${img.id}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
      </div>`).join('');
    g.querySelectorAll('.sp2-card').forEach(c => {
      c.onmouseenter = () => {
        const item = loadedImages.find(i => i.id === Number(c.dataset.id));
        if (item) updateStage(engine, item);
      };
      c.onclick = () => {
        const item = loadedImages.find(i => i.id === Number(c.dataset.id));
        if (item) engine.openModal(item, c);
      };
    });
    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="sp2-more-btn">Xem thêm (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#sp2-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('sp2-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `
        <div class="sp2-controls">
          <div style="flex:1;min-width:200px;position:relative;display:flex;align-items:center;"><span style="position:absolute;left:12px;width:15px;height:15px;color:var(--text-muted);">${ICONS.search}</span><input class="uk-input" id="sp2-search" type="search" placeholder="Tìm câu lệnh AI..." style="padding-left:36px;" /></div>
          <select class="uk-input" id="sp2-sort" style="width:auto;padding:9px 12px;font-size:13px;"><option value="newest">Mới nhất</option><option value="views">Hot nhất</option></select>
        </div>
        <div class="sp2-cats" id="sp2-cats"></div><div class="sp2-grid" id="sp2-grid"></div><div id="sp2-more" style="text-align:center;margin-top:22px;"></div>
      `;
      main.querySelector('#sp2-sort').onchange = (e) => engine.setSort(e.target.value);
      main.querySelector('#sp2-search').addEventListener('input', (e) => engine.setSearch(e.target.value));
      this.renderCategories(engine); this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
