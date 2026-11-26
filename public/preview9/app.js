import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

function getRarity(views = 0) {
  if (views >= 80) return { label: 'MYTHIC ★', cls: 'mythic', color: '#fbbf24' };
  if (views >= 30) return { label: 'EPIC ◆', cls: 'epic', color: '#c084fc' };
  return { label: 'RARE •', cls: '', color: '#38bdf8' };
}

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div style="padding:0 14px;">
        <header class="rpg-guild-bar">
          <div class="rpg-logo" id="rpg-logo">AUDITION GUILD</div>
          <div style="flex:1;max-width:360px;position:relative;display:flex;align-items:center;">
            <span style="position:absolute;left:12px;width:15px;height:15px;color:var(--text-muted);">${ICONS.search}</span>
            <input class="uk-input" id="rpg-search" type="search" placeholder="Tìm thẻ bài prompt..." style="padding-left:36px;" />
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <select class="uk-input" id="rpg-sort" style="width:auto;padding:8px 12px;font-size:13px;">
              <option value="newest">Mới nhất</option>
              <option value="views">Độ hiếm (Views)</option>
            </select>
            <button class="uk-btn rpg-hide-mob" id="rpg-sup">${ICONS.heart} Ủng hộ</button>
            <button class="uk-btn uk-btn-primary rpg-hide-mob" id="rpg-add">${ICONS.plus} Chế tác (+50 EXP)</button>
            <div id="rpg-auth"></div>
          </div>
        </header>
      </div>
      <main id="rpg-main">
        <div class="rpg-cats" id="rpg-cats"></div>
        <div class="rpg-deck" id="rpg-grid"></div>
        <div id="rpg-more" style="text-align:center;margin-top:20px;padding-bottom:84px;"></div>
      </main>
      <nav class="pc-mobile-dock" style="background:rgba(12,10,20,0.94);border-top:1px solid var(--border);">
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Bộ bài</span></button>
        <button class="uk-btn uk-btn-primary" style="width:44px;height:44px;border-radius:12px;margin:0 auto;padding:0;" id="rpg-mob-add">${ICONS.plus}</button>
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
        <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Hồ sơ</span></button>
      </nav>
    `;
    document.getElementById('rpg-logo').onclick = () => engine.setCategory('all');
    document.getElementById('rpg-sup').onclick = () => engine.setPage('support');
    document.getElementById('rpg-add').onclick = () => openAddModal(engine);
    document.getElementById('rpg-mob-add').onclick = () => openAddModal(engine);
    document.getElementById('rpg-sort').onchange = (e) => engine.setSort(e.target.value);
    let t;
    document.getElementById('rpg-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('rpg-auth'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="rpg-u">${ICONS.user} ${escapeHtml(u.username)} (${u.exp || 0} EXP)</button>` : `<button class="uk-btn rpg-hide-mob" id="rpg-l">Đăng nhập</button>`;
    if (u) s.querySelector('#rpg-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#rpg-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('rpg-grid').innerHTML = Array.from({ length: 10 }, () => `<div class="rpg-card" style="aspect-ratio:3/4;opacity:0.35;"></div>`).join('');
  },
  renderCategories(engine) {
    const w = document.getElementById('rpg-cats'); if (!w) return;
    const { categories, selectedCategory } = engine.state;
    w.innerHTML = [`<button class="rpg-tab ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả thẻ</button>`,
      ...categories.map(c => `<button class="rpg-tab ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
  },
  renderGallery(engine) {
    const g = document.getElementById('rpg-grid'); const m = document.getElementById('rpg-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    g.innerHTML = loadedImages.map(img => {
      const rar = getRarity(img.views || 0);
      return `
        <div class="rpg-card ${rar.cls}" data-id="${img.id}">
          <div class="rpg-card-art">
            <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
            <div class="rpg-foil"></div>
            <span class="rpg-badge" style="color:${rar.color};">${rar.label}</span>
          </div>
          <div style="padding:8px 4px 2px;display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <span style="font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</span>
            <button class="uk-btn" data-copy="${img.id}" style="padding:4px 7px;">${ICONS.copy}</button>
          </div>
        </div>`;
    }).join('');
    g.querySelectorAll('.rpg-card').forEach(c => {
      c.addEventListener('pointermove', (e) => {
        if (window.innerWidth < 768) return;
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
        c.style.transform = `rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
        c.style.setProperty('--fx', `${x * 100}%`); c.style.setProperty('--fy', `${y * 100}%`);
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
      c.onclick = (e) => {
        if (e.target.closest('[data-copy]')) return;
        const item = loadedImages.find(i => i.id === Number(c.dataset.id));
        if (item) engine.openModal(item, c);
      };
    });
    g.querySelectorAll('[data-copy]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const item = loadedImages.find(i => i.id === Number(b.dataset.copy));
      if (item) copyText(item.prompt);
    });
    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="rpg-more-btn">Rút thêm thẻ (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#rpg-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('rpg-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `<div class="rpg-cats" id="rpg-cats"></div><div class="rpg-deck" id="rpg-grid"></div><div id="rpg-more" style="text-align:center;margin-top:20px;padding-bottom:84px;"></div>`;
      this.renderCategories(engine); this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
