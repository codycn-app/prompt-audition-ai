import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div class="isl-canvas" id="isl-main">
        <div class="isl-hero-intro">
          <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:var(--accent-2);margin-bottom:6px;">Triển Lãm Câu Lệnh AI</div>
          <h1>Prompt Audition Museum</h1>
          <div style="max-width:460px;margin:14px auto 0;position:relative;display:flex;align-items:center;">
            <span style="position:absolute;left:16px;width:16px;height:16px;color:var(--text-muted);">${ICONS.search}</span>
            <input class="uk-input" id="isl-search" type="search" placeholder="Tìm kiếm tác phẩm hoặc câu lệnh..." style="padding:12px 16px 12px 42px;border-radius:999px;background:rgba(255,255,255,0.06);" />
          </div>
        </div>
        <div class="isl-grid" id="isl-grid"></div>
        <div id="isl-more" style="text-align:center;margin-top:32px;"></div>
      </div>

      <div class="isl-island-wrap">
        <div class="isl-popover pc-hidden" id="isl-cat-pop"></div>
        <div class="isl-island">
          <button class="uk-btn" id="isl-home" style="padding:8px 12px;">${ICONS.home}</button>
          <button class="uk-btn" id="isl-cat-toggle" style="padding:8px 14px;">Chuyên mục ▾</button>
          <button class="uk-btn uk-btn-primary" id="isl-add" style="padding:8px 14px;">${ICONS.plus} Thêm</button>
          <button class="uk-btn" id="isl-sup" style="padding:8px 12px;">${ICONS.heart}</button>
          <div id="isl-auth"></div>
        </div>
      </div>
    `;
    const pop = document.getElementById('isl-cat-pop');
    document.getElementById('isl-cat-toggle').onclick = () => pop.classList.toggle('pc-hidden');
    document.getElementById('isl-home').onclick = () => engine.setCategory('all');
    document.getElementById('isl-sup').onclick = () => engine.setPage('support');
    document.getElementById('isl-add').onclick = () => openAddModal(engine);
    let t;
    document.getElementById('isl-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
  },
  renderAuth(engine) {
    const s = document.getElementById('isl-auth'); const u = engine.state.currentUser;
    s.innerHTML = `<button class="uk-btn" id="isl-u" style="padding:8px 12px;">${ICONS.user}</button>`;
    s.querySelector('#isl-u').onclick = () => u ? engine.setPage('profile') : openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('isl-grid').innerHTML = Array.from({ length: 8 }, () => `<div class="isl-scene"><div class="isl-face" style="background:var(--surface);opacity:0.35;"></div></div>`).join('');
  },
  renderCategories(engine) {
    const pop = document.getElementById('isl-cat-pop'); if (!pop) return;
    const { categories, selectedCategory } = engine.state;
    pop.innerHTML = [`<button class="uk-btn ${selectedCategory === 'all' ? 'uk-btn-primary' : ''}" data-cat="all">Tất cả</button>`,
      ...categories.map(c => `<button class="uk-btn ${selectedCategory === c.id ? 'uk-btn-primary' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    pop.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => {
      pop.classList.add('pc-hidden');
      engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat));
    });
  },
  renderGallery(engine) {
    const g = document.getElementById('isl-grid'); const m = document.getElementById('isl-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    g.innerHTML = loadedImages.map(img => `
      <div class="isl-scene" data-id="${img.id}">
        <div class="isl-flip">
          <div class="isl-face isl-front">
            <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
            <div style="position:absolute;inset:auto 0 0 0;padding:24px 12px 10px;background:linear-gradient(to top,rgba(9,13,22,0.94),transparent);display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <span style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</span>
              <button class="uk-btn" data-flip="${img.id}" style="padding:5px 10px;font-size:11px;">Lật 3D</button>
            </div>
          </div>
          <div class="isl-face isl-back">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</strong>
              <button class="uk-btn" data-flip="${img.id}" style="padding:4px 9px;font-size:11px;">Ảnh</button>
            </div>
            <div style="flex:1;font-size:12px;line-height:1.55;color:#cbd5e1;overflow-y:auto;background:rgba(0,0,0,0.35);padding:10px;border-radius:10px;">${escapeHtml(img.prompt)}</div>
            <div style="display:flex;gap:6px;">
              <button class="uk-btn uk-btn-primary" data-copy="${img.id}" style="flex:1;padding:7px;">${ICONS.copy} Copy</button>
              <button class="uk-btn" data-open="${img.id}" style="padding:7px;">${ICONS.article}</button>
            </div>
          </div>
        </div>
      </div>`).join('');
    g.querySelectorAll('[data-flip]').forEach(b => b.onclick = (e) => { e.stopPropagation(); b.closest('.isl-scene').classList.toggle('flipped'); });
    g.querySelectorAll('.isl-front').forEach(f => f.onclick = (e) => {
      if (e.target.closest('[data-flip]')) return;
      const item = loadedImages.find(i => i.id === Number(f.closest('.isl-scene').dataset.id));
      if (item) engine.openModal(item, f);
    });
    g.querySelectorAll('[data-copy]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const item = loadedImages.find(i => i.id === Number(b.dataset.copy));
      if (item) copyText(item.prompt);
    });
    g.querySelectorAll('[data-open]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const item = loadedImages.find(i => i.id === Number(b.dataset.open));
      if (item) engine.openArticle(item);
    });
    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="isl-more-btn">Xem thêm (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#isl-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('isl-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `<div class="isl-hero-intro"><div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:var(--accent-2);margin-bottom:6px;">Triển Lãm Câu Lệnh AI</div><h1>Prompt Audition Museum</h1></div><div class="isl-grid" id="isl-grid"></div><div id="isl-more" style="text-align:center;margin-top:32px;"></div>`;
      this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
